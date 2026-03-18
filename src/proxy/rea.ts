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
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ): void;
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
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ) {
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
//      _____  ______     __          __
//     |  __ \|  ____|   /\ \        / /
//     | |__) | |__     /  \ \  /\  / /
//     |  _  /|  __|   / /\ \ \/  \/ /
//     | | \ \| |____ / ____ \  /\  /
//     |_|  \_\______/_/    \_\/  \/
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
  get read_only(): StateREA<ROUT, OptionNone, WOUT>;
  get read_write(): StateREAW<ROUT, WOUT, OptionNone>;
}

export type StateProxyREAW<
  S extends StateREAW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateREAW<ROUT, WOUT, OptionNone> & OwnerWrite<S, RIN, WIN, ROUT, WOUT>;

class REAW<
  S extends StateREAW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
>
  extends StateBase<ROUT, WOUT, OptionNone, Result<ROUT, string>>
  implements OwnerWrite<S, RIN, WIN, ROUT, WOUT>
{
  constructor(
    state: S,
    transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
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
  #buffer?: Result<ROUT, string>;

  private transform_read(value: Result<RIN, string>): Result<ROUT, string> {
    return value as Result<ROUT, string>;
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
  set_transform_read(
    transform: (val: Result<RIN, string>) => Result<ROUT, string>,
  ) {
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
  get read_only(): StateREA<ROUT, OptionNone, WOUT> {
    return this as StateREA<ROUT, OptionNone, WOUT>;
  }
  get read_write(): StateREAW<ROUT, WOUT, OptionNone> {
    return this as StateREAW<ROUT, WOUT, OptionNone>;
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
function reaw_from<
  S extends StateROAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateROAW<RIN, WIN>,
  transform_read?: (value: ResultOk<RIN>) => Result<ROUT, string>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyREAW<S, RIN, WIN, ROUT, WOUT>;
function reaw_from<
  S extends StateREAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: StateREAW<RIN, WIN>,
  transform_read?: (value: Result<RIN, string>) => Result<ROUT, string>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyREAW<S, RIN, WIN, ROUT, WOUT>;
function reaw_from<
  S extends StateREAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?:
    | ((value: ResultOk<RIN>) => Result<ROUT, string>)
    | ((value: Result<RIN, string>) => Result<ROUT, string>),
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyREAW<S, RIN, WIN, ROUT, WOUT> {
  return new REAW<S, RIN, WIN, ROUT, WOUT>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyREAW<S, RIN, WIN, ROUT, WOUT>;
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
  reaw: reaw_from,
};
