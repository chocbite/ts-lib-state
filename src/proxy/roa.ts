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
//      _____   ____
//     |  __ \ / __ \   /\
//     | |__) | |  | | /  \
//     |  _  /| |  | |/ /\ \
//     | | \ \| |__| / ____ \
//     |_|  \_\\____/_/    \_\
interface Owner<S extends State<any, any>, RIN, ROUT, WIN, WOUT> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(transform: ROATransform<S, RIN, ROUT>): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(transform: (val: WOUT) => WIN): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateROA<ROUT, OptionNone, WOUT>;
}

type ROATransform<S extends State<any, any>, IN, OUT> = (
  value: S extends StateROA<any>
    ? ResultOk<IN>
    : IN extends StateREA<any>
      ? Result<IN, string>
      : never,
) => ResultOk<OUT>;

export type StateProxyROA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer WT> ? WT : any,
  WOUT = WIN,
> = StateROA<ROUT, OptionNone, WOUT> & Owner<S, RIN, ROUT, WIN, WOUT>;

class ROA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer WT> ? WT : never,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, ResultOk<ROUT>>
  implements Owner<S, RIN, ROUT, WIN, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
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
  #buffer?: ResultOk<ROUT>;

  private transform_read(value: Result<RIN, string>): ResultOk<ROUT> {
    return value as unknown as ResultOk<ROUT>;
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
  set_transform_read(transform: ROATransform<S, RIN, ROUT>) {
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
  get read_only(): StateROA<ROUT, OptionNone, WOUT> {
    return this as StateROA<ROUT, OptionNone, WOUT>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
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

/**Creates a guarenteed ok proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function roa_from<
  S extends StateROA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateROA<RIN, any, WIN>,
  transform?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
): StateProxyROA<S, RIN, ROUT, WIN, WOUT>;
function roa_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateREA<RIN, any, WIN>,
  transform: (value: Result<RIN, string>) => ResultOk<ROUT>,
): StateProxyROA<S, RIN, ROUT, WIN, WOUT>;
function roa_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?:
    | ((value: ResultOk<RIN>) => ResultOk<ROUT>)
    | ((value: Result<RIN, string>) => ResultOk<ROUT>),
): StateProxyROA<S, RIN, ROUT, WIN, WOUT> {
  return new ROA<S, RIN, ROUT, WIN, WOUT>(state, transform) as StateProxyROA<
    S,
    RIN,
    ROUT,
    WIN,
    WOUT
  >;
}

//##################################################################################################################################################
//      _____   ____           __          _______
//     |  __ \ / __ \   /\     \ \        / / ____|
//     | |__) | |  | | /  \     \ \  /\  / / (___
//     |  _  /| |  | |/ /\ \     \ \/  \/ / \___ \
//     | | \ \| |__| / ____ \     \  /\  /  ____) |
//     |_|  \_\\____/_/    \_\     \/  \/  |_____/

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
  get read_only(): StateROA<ROUT, OptionNone, WOUT>;
  get read_write(): StateROAWS<ROUT, WOUT, OptionNone>;
}

export type StateProxyROAWS<
  S extends StateREAWS<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROAWS<ROUT, WOUT, OptionNone> & OwnerWS<S, RIN, WIN, ROUT, WOUT>;

class ROAWS<
  S extends StateREAWS<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, ResultOk<ROUT>>
  implements OwnerWS<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
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
  #buffer?: ResultOk<ROUT>;

  private transform_read(value: Result<RIN, string>): ResultOk<ROUT> {
    return value as unknown as ResultOk<ROUT>;
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
  set_transform_read(transform: (val: Result<RIN, string>) => ResultOk<ROUT>) {
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
  get read_only(): StateROA<ROUT, OptionNone, WOUT> {
    return this as StateROA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROAWS<ROUT, WOUT, OptionNone> {
    return this as StateROAWS<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
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
function roa_ws_from<
  S extends StateROAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAWS<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWS<S, RIN, WIN, ROUT, WOUT>;
function roa_ws_from<
  S extends StateREAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAWS<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWS<S, RIN, WIN, ROUT, WOUT>;
function roa_ws_from<
  S extends StateREAWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => ResultOk<ROUT>)
    | ((value: Result<RIN, string>) => ResultOk<ROUT>),
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWS<S, RIN, WIN, ROUT, WOUT> {
  return new ROAWS<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROAWS<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____   ____           __          __
//     |  __ \ / __ \   /\     \ \        / /\
//     | |__) | |  | | /  \     \ \  /\  / /  \
//     |  _  /| |  | |/ /\ \     \ \/  \/ / /\ \
//     | | \ \| |__| / ____ \     \  /\  / ____ \
//     |_|  \_\\____/_/    \_\     \/  \/_/    \_\

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
  get read_only(): StateROA<ROUT, OptionNone, WOUT>;
  get read_write(): StateROAWA<ROUT, WOUT, OptionNone>;
}

export type StateProxyROAWA<
  S extends StateREAWA<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROAWA<ROUT, WOUT, OptionNone> & OwnerWA<S, RIN, WIN, ROUT, WOUT>;

class ROAWA<
  S extends StateREAWA<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, ResultOk<ROUT>>
  implements OwnerWA<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
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
  #buffer?: ResultOk<ROUT>;

  private transform_read(value: Result<RIN, string>): ResultOk<ROUT> {
    return value as unknown as ResultOk<ROUT>;
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
  set_transform_read(transform: (val: Result<RIN, string>) => ResultOk<ROUT>) {
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
  get read_only(): StateROA<ROUT, OptionNone, WOUT> {
    return this as StateROA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROAWA<ROUT, WOUT, OptionNone> {
    return this as StateROAWA<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): false {
    return this.#state.rsync as false;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
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
function roa_wa_from<
  S extends StateROAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAWA<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWA<S, RIN, WIN, ROUT, WOUT>;
function roa_wa_from<
  S extends StateREAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAWA<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWA<S, RIN, WIN, ROUT, WOUT>;
function roa_wa_from<
  S extends StateREAWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => ResultOk<ROUT>)
    | ((value: Result<RIN, string>) => ResultOk<ROUT>),
  transform_write?: (value: WOUT) => WIN,
): StateProxyROAWA<S, RIN, WIN, ROUT, WOUT> {
  return new ROAWA<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROAWA<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Proxy state redirecting another state */
export const STATE_PROXY_ROA = {
  roa: roa_from,
  roa_ws: roa_ws_from,
  roa_wa: roa_wa_from,
};
