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
  type StateRES,
  type StateRESWA,
  type StateRESWS,
  type StateROS,
  type StateROSWA,
  type StateROSWS,
} from "../types";

//##################################################################################################################################################
//      _____   ____   _____
//     |  __ \ / __ \ / ____|
//     | |__) | |  | | (___
//     |  _  /| |  | |\___ \
//     | | \ \| |__| |____) |
//     |_|  \_\\____/|_____/
interface Owner<S extends State<any, any>, RIN, ROUT, WIN, WOUT> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(transform: ROSTransform<S, RIN, ROUT>): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(transform: (val: WOUT) => WIN): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateROS<ROUT, OptionNone, WOUT>;
}

type ROSTransform<S extends State<any, any>, RIN, ROUT> = (
  value: S extends StateROS<any>
    ? ResultOk<RIN>
    : RIN extends StateRES<any>
      ? Result<RIN, string>
      : never,
) => ResultOk<ROUT>;

export type StateProxyROS<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer WT> ? WT : any,
  WOUT = WIN,
> = StateROS<ROUT, OptionNone, WOUT> & Owner<S, RIN, ROUT, WIN, WOUT>;

class ROS<
  S extends StateRES<RIN, any, WIN>,
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
  set_transform_read(transform: ROSTransform<S, RIN, ROUT>) {
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
  get read_only(): StateROS<ROUT, OptionNone, WOUT> {
    return this as StateROS<ROUT, OptionNone, WOUT>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): true {
    return true;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
  ): Promise<T> {
    return func(this.get());
  }
  get(): ResultOk<ROUT> {
    if (this.#buffer) return this.#buffer;
    return this.transform_read(this.#state.get());
  }
  ok(): ROUT {
    return this.get().value;
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

/**Creates a sync proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function ros_from<
  S extends StateROS<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateROS<RIN, any, WIN>,
  transform?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
): StateProxyROS<S, RIN, ROUT, WIN, WOUT>;
function ros_from<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: StateRES<RIN, any, WIN>,
  transform: (value: Result<RIN, string>) => ResultOk<ROUT>,
): StateProxyROS<S, RIN, ROUT, WIN, WOUT>;
function ros_from<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?:
    | ((value: ResultOk<RIN>) => ResultOk<ROUT>)
    | ((value: Result<RIN, string>) => ResultOk<ROUT>),
): StateProxyROS<S, RIN, ROUT, WIN, WOUT> {
  return new ROS<S, RIN, ROUT, WIN, WOUT>(state, transform) as StateProxyROS<
    S,
    RIN,
    ROUT,
    WIN,
    WOUT
  >;
}

//##################################################################################################################################################
//      _____   ____   _____  __          _______
//     |  __ \ / __ \ / ____| \ \        / / ____|
//     | |__) | |  | | (___    \ \  /\  / / (___
//     |  _  /| |  | |\___ \    \ \/  \/ / \___ \
//     | | \ \| |__| |____) |    \  /\  /  ____) |
//     |_|  \_\\____/|_____/      \/  \/  |_____/
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
  get read_only(): StateROS<ROUT, OptionNone, WOUT>;
  get read_write(): StateROSWS<ROUT, WOUT, OptionNone>;
}

export type StateProxyROSWS<
  S extends StateRESWS<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROSWS<ROUT, WOUT, OptionNone> & OwnerWS<S, RIN, WIN, ROUT, WOUT>;

class ROSWS<
  S extends StateRESWS<RIN, WIN>,
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
  get read_only(): StateROS<ROUT, OptionNone, WOUT> {
    return this as StateROS<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROSWS<ROUT, WOUT, OptionNone> {
    return this as StateROSWS<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): true {
    return true;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    return func(this.transform_read(await this.#state));
  }
  get(): ResultOk<ROUT> {
    if (this.#buffer) return this.#buffer;
    return this.transform_read(this.#state.get());
  }
  ok(): ROUT {
    return this.get().value;
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
function ros_ws_from<
  S extends StateROSWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROSWS<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROSWS<S, RIN, WIN, ROUT, WOUT>;
function ros_ws_from<
  S extends StateRESWS<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateRESWS<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROSWS<S, RIN, WIN, ROUT, WOUT>;
function ros_ws_from<
  S extends StateRESWS<RIN, WIN>,
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
): StateProxyROSWS<S, RIN, WIN, ROUT, WOUT> {
  return new ROSWS<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROSWS<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____   ____   _____  __          __
//     |  __ \ / __ \ / ____| \ \        / /\
//     | |__) | |  | | (___    \ \  /\  / /  \
//     |  _  /| |  | |\___ \    \ \/  \/ / /\ \
//     | | \ \| |__| |____) |    \  /\  / ____ \
//     |_|  \_\\____/|_____/      \/  \/_/    \_\
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
  get read_only(): StateROS<ROUT, OptionNone, WOUT>;
  get read_write(): StateROSWA<ROUT, WOUT, OptionNone>;
}
export type StateProxyROSWA<
  S extends StateRESWA<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROSWA<ROUT, WOUT, OptionNone> & OwnerWA<S, RIN, WIN, ROUT, WOUT>;

class ROSWA<
  S extends StateRESWA<RIN, WIN>,
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
  get read_only(): StateROS<ROUT, OptionNone, WOUT> {
    return this as StateROS<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROSWA<ROUT, WOUT, OptionNone> {
    return this as StateROSWA<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): true {
    return true;
  }
  async then<T = ResultOk<ROUT>>(
    func: (value: ResultOk<ROUT>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    return func(this.transform_read(await this.#state));
  }
  get(): ResultOk<ROUT> {
    if (this.#buffer) return this.#buffer;
    return this.transform_read(this.#state.get());
  }
  ok(): ROUT {
    return this.get().value;
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
function ros_wa_from<
  S extends StateROSWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROSWA<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROSWA<S, RIN, WIN, ROUT, WOUT>;
function ros_wa_from<
  S extends StateRESWA<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateRESWA<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: (value: WOUT) => WIN,
): StateProxyROSWA<S, RIN, WIN, ROUT, WOUT>;
function ros_wa_from<
  S extends StateRESWA<RIN, WIN>,
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
): StateProxyROSWA<S, RIN, WIN, ROUT, WOUT> {
  return new ROSWA<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROSWA<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Proxy state redirecting another state */
export const STATE_PROXY_ROS = {
  ros: ros_from,
  ros_ws: ros_ws_from,
  ros_wa: ros_wa_from,
};
