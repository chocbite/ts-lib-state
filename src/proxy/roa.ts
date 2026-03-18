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
  type StateREA,
  type StateREAW,
  type StateROA,
  type StateROAW,
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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ): void;
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
  set_transform_read(transform: ROATransform<S, RIN, ROUT>) {
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
//      _____   ____     __          __
//     |  __ \ / __ \   /\ \        / /
//     | |__) | |  | | /  \ \  /\  / /
//     |  _  /| |  | |/ /\ \ \/  \/ /
//     | | \ \| |__| / ____ \  /\  /
//     |_|  \_\\____/_/    \_\/  \/
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
  get read_only(): StateROA<ROUT, OptionNone, WOUT>;
  get read_write(): StateROAW<ROUT, WOUT, OptionNone>;
}

export type StateProxyROAW<
  S extends StateREAW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROAW<ROUT, WOUT, OptionNone> & OwnerWrite<S, RIN, WIN, ROUT, WOUT>;

class ROAW<
  S extends StateREAW<RIN, WIN>,
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
  get read_only(): StateROA<ROUT, OptionNone, WOUT> {
    return this as StateROA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateROAW<ROUT, WOUT, OptionNone> {
    return this as StateROAW<ROUT, WOUT, OptionNone>;
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
function roaw_from<
  S extends StateROAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAW<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROAW<S, RIN, WIN, ROUT, WOUT>;
function roaw_from<
  S extends StateREAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAW<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROAW<S, RIN, WIN, ROUT, WOUT>;
function roaw_from<
  S extends StateREAW<RIN, WIN>,
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
): StateProxyROAW<S, RIN, WIN, ROUT, WOUT> {
  return new ROAW<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROAW<S, RIN, WIN, ROUT, WOUT>;
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
  roaw: roaw_from,
};
