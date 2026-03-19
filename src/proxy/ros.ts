import {
  err,
  none,
  ok,
  OptionNone,
  ResultOk,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import {
  type State,
  type StateRES,
  type StateRESW,
  type StateROS,
  type StateROSW,
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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ): void;
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
  private transform_wout_win?: (value: WOUT) => WIN;
  private transform_win_wout?: (value: WIN) => WOUT;
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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ) {
    this.transform_wout_win = wout_win;
    this.transform_win_wout = win_wout;
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
  write(value: WOUT): Promise<Result<void, string>> {
    if (!this.#state.write) return Promise.resolve(err("not writable"));
    if (!this.transform_wout_win) return Promise.resolve(err("not writable"));
    return this.#state.write(this.transform_wout_win(value));
  }

  //@ts-expect-error typescript workaround
  get limit(): ((value: WOUT) => Promise<Result<WOUT, string>>) | undefined {
    const limit = this.#state.limit;
    return limit
      ? (value) => {
          if (!this.transform_wout_win)
            return Promise.resolve(err("not writable"));
          return limit(this.transform_wout_win(value)).then((res) => {
            if (!this.transform_win_wout) return err("not writable");
            if (res.err) return err(res.error);
            return ok(this.transform_win_wout(res.value));
          });
        }
      : undefined;
  }
  //@ts-expect-error typescript workaround
  get check(): ((value: WOUT) => Promise<Result<WOUT, string>>) | undefined {
    const check = this.#state.check;
    return check
      ? (value) => {
          if (!this.transform_wout_win)
            return Promise.resolve(err("not writable"));
          return check(this.transform_wout_win(value)).then((res) => {
            if (!this.transform_win_wout) return err("not writable");
            if (res.err) return err(res.error);
            return ok(this.transform_win_wout(res.value));
          });
        }
      : undefined;
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
//      _____   ____   _______          __
//     |  __ \ / __ \ / ____\ \        / /
//     | |__) | |  | | (___  \ \  /\  / /
//     |  _  /| |  | |\___ \  \ \/  \/ /
//     | | \ \| |__| |____) |  \  /\  /
//     |_|  \_\\____/|_____/    \/  \/
interface OwnerWrite<
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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ): void;
  get state(): State<ROUT, WOUT, OptionNone>;
  get read_only(): StateROS<ROUT, OptionNone, WOUT>;
  get read_write(): StateROSW<ROUT, WOUT, OptionNone>;
}
export type StateProxyROSW<
  S extends StateRESW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROSW<ROUT, WOUT, OptionNone> & OwnerWrite<S, RIN, WIN, ROUT, WOUT>;

class ROSW<
  S extends StateRESW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, ResultOk<ROUT>>
  implements OwnerWrite<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
    transform_write?: {
      wout_win: (val: WOUT) => WIN;
      win_wout: (val: WIN) => WOUT;
    },
  ) {
    super();
    this.#state = state;
    if (transform_read) this.transform_read = transform_read;
    if (transform_write) {
      this.transform_wout_win = transform_write.wout_win;
      this.transform_win_wout = transform_write.win_wout;
    }
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
  private transform_wout_win(value: WOUT): WIN {
    return value as unknown as WIN;
  }
  private transform_win_wout(value: WIN): WOUT {
    return value as unknown as WOUT;
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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ) {
    this.transform_wout_win = wout_win;
    this.transform_win_wout = win_wout;
  }
  get state(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }
  get read_only(): StateROS<ROUT, OptionNone, WOUT> {
    return this as StateROS<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROSW<ROUT, WOUT, OptionNone> {
    return this as StateROSW<ROUT, WOUT, OptionNone>;
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
  write(value: WOUT): Promise<Result<void, string>> {
    return this.#state.write(this.transform_wout_win(value));
  }
  //@ts-expect-error typescript workaround
  get limit(): ((value: WOUT) => Promise<Result<WOUT, string>>) | undefined {
    const limit = this.#state.limit;
    return limit
      ? (value) => {
          return limit(this.transform_wout_win(value)).then((res) => {
            if (res.err) return err(res.error);
            return ok(this.transform_win_wout(res.value));
          });
        }
      : undefined;
  }
  //@ts-expect-error typescript workaround
  get check(): ((value: WOUT) => Promise<Result<WOUT, string>>) | undefined {
    const check = this.#state.check;
    return check
      ? (value) => {
          return check(this.transform_wout_win(value)).then((res) => {
            if (res.err) return err(res.error);
            return ok(this.transform_win_wout(res.value));
          });
        }
      : undefined;
  }
}

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function rosw_from<
  S extends StateROSW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROSW<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROSW<S, RIN, WIN, ROUT, WOUT>;
function rosw_from<
  S extends StateRESW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateRESW<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROSW<S, RIN, WIN, ROUT, WOUT>;
function rosw_from<
  S extends StateRESW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => ResultOk<ROUT>)
    | ((value: Result<RIN, string>) => ResultOk<ROUT>),
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROSW<S, RIN, WIN, ROUT, WOUT> {
  return new ROSW<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROSW<S, RIN, WIN, ROUT, WOUT>;
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
  rosw: rosw_from,
};
