import {
  err,
  none,
  OptionNone,
  ResultOk,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import {
  type State,
  type StateREA,
  type StateREAWA,
  type StateREAWS,
  type StateROA,
  type StateROAWA,
  type StateROAWS,
} from "../types";

//##################################################################################################################################################
//      _____  ______
//     |  __ \|  ____|   /\
//     | |__) | |__     /  \
//     |  _  /|  __|   / /\ \
//     | | \ \| |____ / ____ \
//     |_|  \_\______/_/    \_\
interface Owner<S, RIN, ROUT, WIN, WOUT> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(transform: (val: WOUT) => WIN): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateREA<ROUT, OptionNone, WOUT>;
}

export type StateProxyREA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer WT> ? WT : any,
  WOUT = WIN,
> = StateREA<ROUT, OptionNone, WOUT> & Owner<S, RIN, ROUT, WIN, WOUT>;

class REA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer WT> ? WT : never,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, Result<ROUT, string>>
  implements Owner<S, RIN, ROUT, WIN, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
  ) {
    super();
    this.#state = state;
    if (transform_read) this.transform_read = transform_read;
  }

  #state: S;
  #subscriber = (value: Result<RIN, string>) => {
    this.#buffer = this.transform_read(value);
    this.update_subs(this.#buffer);
  };
  #buffer?: Result<ROUT, string>;

  private transform_read(value: Result<RIN, string>): Result<ROUT, string> {
    return value as Result<ROUT, string>;
  }
  private transform_write?: (value: WOUT) => WIN;
  protected on_subscribe(run: boolean = false): void {
    this.#state.sub(this.#subscriber, run);
  }
  protected on_unsubscribe(): void {
    this.#state.unsub(this.#subscriber);
    this.#buffer = undefined;
  }

  //#Owner Context
  set_state(state: S) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.#state = state;
      this.on_subscribe(true);
    } else this.#state = state;
  }
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.transform_read = transform;
      this.on_subscribe(true);
    } else this.transform_read = transform;
  }
  set_transform_write(transform: (val: WOUT) => WIN) {
    this.transform_write = transform;
  }
  get state(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }
  get read_only(): StateREA<ROUT, OptionNone, WOUT> {
    return this as StateREA<ROUT, OptionNone, WOUT>;
  }

  //#Reader Context
  get rok(): false {
    return this.#state.rok as false;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = Result<ROUT, string>>(
    func: (value: Result<ROUT, string>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    return func(this.transform_read(await this.#state));
  }
  related(): OptionNone {
    return none();
  }

  //#Writer Context
  get writable(): boolean {
    return this.#state.writable;
  }
  get wsync(): boolean {
    return this.#state.wsync;
  }
  async write(value: WOUT): Promise<Result<void, string>> {
    if (!this.#state.write) return err("State not writable");
    if (!this.transform_write) return err("State not writable");
    return this.#state.write(this.transform_write(value));
  }
  write_sync(value: WOUT): Result<void, string> {
    if (!this.#state.write_sync) return err("State not writable");
    if (!this.transform_write) return err("State not writable");
    return this.#state.write_sync(this.transform_write(value));
  }
  limit(_value: WOUT): Result<WOUT, string> {
    return err("Limit not supported on proxy states");
  }
  check(_value: WOUT): Result<WOUT, string> {
    return err("Check not supported on proxy states");
  }
}

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function rea_from<
  S extends StateROA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateROA<RIN, any, WIN>,
  transform?: (value: ResultOk<RIN>) => Result<ROUT, string>,
): StateProxyREA<S, RIN, ROUT, WIN, WOUT>;
function rea_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateREA<RIN, any, WIN>,
  transform?: (value: Result<RIN, string>) => Result<ROUT, string>,
): StateProxyREA<S, RIN, ROUT, WIN, WOUT>;
function rea_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?:
    | ((value: ResultOk<RIN>) => Result<ROUT, string>)
    | ((value: Result<RIN, string>) => Result<ROUT, string>),
): StateProxyREA<S, RIN, ROUT, WIN, WOUT> {
  return new REA<S, RIN, ROUT, WIN, WOUT>(state, transform) as StateProxyREA<
    S,
    RIN,
    ROUT,
    WIN,
    WOUT
  >;
}

//##################################################################################################################################################
//      _____  ______           __          _______
//     |  __ \|  ____|   /\     \ \        / / ____|
//     | |__) | |__     /  \     \ \  /\  / / (___
//     |  _  /|  __|   / /\ \     \ \/  \/ / \___ \
//     | | \ \| |____ / ____ \     \  /\  /  ____) |
//     |_|  \_\______/_/    \_\     \/  \/  |_____/
interface OwnerWS<
  S,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(transform: (val: WOUT) => WIN): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateREA<ROUT, OptionNone, WOUT>;
  get read_write(): StateREAWS<ROUT, WOUT, OptionNone>;
}

export type StateProxyREAWS<
  S extends StateREAWS<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateREAWS<ROUT, WOUT, OptionNone> & OwnerWS<S, RIN, WIN, ROUT, WOUT>;

class REAWS<
  S extends StateREAWS<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, Result<ROUT, string>>
  implements OwnerWS<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
    transform_write?: (value: WOUT) => WIN,
  ) {
    super();
    this.#state = state;
    if (transform_read) this.transform_read = transform_read;
    if (transform_write) this.transform_write = transform_write;
  }

  #state: S;
  #subscriber = (value: Result<RIN, string>) => {
    this.#buffer = this.transform_read(value);
    this.update_subs(this.#buffer);
  };
  #buffer?: Result<ROUT, string>;

  private transform_read(value: Result<RIN, string>): Result<ROUT, string> {
    return value as Result<ROUT, string>;
  }
  private transform_write(value: WOUT): WIN {
    return value as unknown as WIN;
  }
  protected on_subscribe(run: boolean = false): void {
    this.#state.sub(this.#subscriber, run);
  }
  protected on_unsubscribe(): void {
    this.#state.unsub(this.#subscriber);
    this.#buffer = undefined;
  }

  //#Owner Context
  set_state(state: S) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.#state = state;
      this.on_subscribe(true);
    } else this.#state = state;
  }
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.transform_read = transform;
      this.on_subscribe(true);
    } else this.transform_read = transform;
  }
  set_transform_write(transform: (val: WOUT) => WIN) {
    this.transform_write = transform;
  }
  get state(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }
  get read_only(): StateREA<ROUT, OptionNone, WOUT> {
    return this as StateREA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateREAWS<ROUT, WOUT, OptionNone> {
    return this as StateREAWS<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): false {
    return this.#state.rok as false;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = Result<ROUT, string>>(
    func: (value: Result<ROUT, string>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    return func(this.transform_read(await this.#state));
  }
  related(): OptionNone {
    return none();
  }

  //#Writer Context
  get writable(): true {
    return true;
  }
  get wsync(): true {
    return true;
  }
  write(value: WOUT): Promise<Result<void, string>> {
    return this.#state.write(this.transform_write(value));
  }
  write_sync(value: WOUT): Result<void, string> {
    return this.#state.write_sync(this.transform_write(value));
  }
  limit(_value: WOUT): Result<WOUT, string> {
    return err("Limit not supported on proxy states");
  }
  check(_value: WOUT): Result<WOUT, string> {
    return err("Check not supported on proxy states");
  }
}

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function rea_ws_from<
  S extends StateROAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAWS<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWS<S, RIN, WIN, ROUT, WOUT>;
function rea_ws_from<
  S extends StateREAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAWS<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => Result<ROUT, string>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWS<S, RIN, WIN, ROUT, WOUT>;
function rea_ws_from<
  S extends StateREAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => Result<ROUT, string>)
    | ((value: Result<RIN, string>) => Result<ROUT, string>),
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWS<S, RIN, WIN, ROUT, WOUT> {
  return new REAWS<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyREAWS<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____  ______           __          __
//     |  __ \|  ____|   /\     \ \        / /\
//     | |__) | |__     /  \     \ \  /\  / /  \
//     |  _  /|  __|   / /\ \     \ \/  \/ / /\ \
//     | | \ \| |____ / ____ \     \  /\  / ____ \
//     |_|  \_\______/_/    \_\     \/  \/_/    \_\
interface OwnerWA<
  S,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(transform: (val: WOUT) => WIN): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateREA<ROUT, OptionNone, WOUT>;
  get read_write(): StateREAWA<ROUT, WOUT, OptionNone>;
}

export type StateProxyREAWA<
  S extends StateREAWA<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateREAWA<ROUT, WOUT, OptionNone> & OwnerWA<S, RIN, WIN, ROUT, WOUT>;

class REAWA<
  S extends StateREAWA<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, Result<ROUT, string>>
  implements OwnerWA<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
    transform_write?: (value: WOUT) => WIN,
  ) {
    super();
    this.#state = state;
    if (transform_read) this.transform_read = transform_read;
    if (transform_write) this.transform_write = transform_write;
  }

  #state: S;
  #subscriber = (value: Result<RIN, string>) => {
    this.#buffer = this.transform_read(value);
    this.update_subs(this.#buffer);
  };
  #buffer?: Result<ROUT, string>;

  private transform_read(value: Result<RIN, string>): Result<ROUT, string> {
    return value as Result<ROUT, string>;
  }

  private transform_write(value: WOUT): WIN {
    return value as unknown as WIN;
  }

  protected on_subscribe(run: boolean = false): void {
    this.#state.sub(this.#subscriber, run);
  }
  protected on_unsubscribe(): void {
    this.#state.unsub(this.#subscriber);
    this.#buffer = undefined;
  }

  //#Owner Context
  set_state(state: S) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.#state = state;
      this.on_subscribe(true);
    } else this.#state = state;
  }
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.transform_read = transform;
      this.on_subscribe(true);
    } else this.transform_read = transform;
  }
  set_transform_write(transform: (val: WOUT) => WIN) {
    this.transform_write = transform;
  }
  get state(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }
  get read_only(): StateREA<ROUT, OptionNone, WOUT> {
    return this as StateREA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateREAWA<ROUT, WOUT, OptionNone> {
    return this as StateREAWA<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): false {
    return this.#state.rok as false;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = Result<ROUT, string>>(
    func: (value: Result<ROUT, string>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    return func(this.transform_read(await this.#state));
  }
  related(): OptionNone {
    return none();
  }

  //#Writer Context
  get writable(): true {
    return true;
  }
  get wsync(): boolean {
    return this.#state.wsync;
  }
  write(value: WOUT): Promise<Result<void, string>> {
    return this.#state.write(this.transform_write(value));
  }
  limit(_value: WOUT): Result<WOUT, string> {
    return err("Limit not supported on proxy states");
  }
  check(_value: WOUT): Result<WOUT, string> {
    return err("Check not supported on proxy states");
  }
}

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function rea_wa_from<
  S extends StateROAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAWA<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWA<S, RIN, WIN, ROUT, WOUT>;
function rea_wa_from<
  S extends StateREAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAWA<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => Result<ROUT, string>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWA<S, RIN, WIN, ROUT, WOUT>;
function rea_wa_from<
  S extends StateREAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => Result<ROUT, string>)
    | ((value: Result<RIN, string>) => Result<ROUT, string>),
  transform_write?: (value: WOUT) => WIN,
): StateProxyREAWA<S, RIN, WIN, ROUT, WOUT> {
  return new REAWA<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyREAWA<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Proxy state redirecting another state */
export const STATE_PROXY_REA = {
  rea: rea_from,
  rea_ws: rea_ws_from,
  rea_wa: rea_wa_from,
};
