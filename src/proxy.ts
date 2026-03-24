import {
  err,
  none,
  ok,
  OptionNone,
  ResultOk,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import {
  StateInferResult,
  StateRES,
  StateRESW,
  StateROS,
  StateROSW,
  type State,
  type StateREA,
  type StateREAW,
  type StateROA,
  type StateROAW,
} from "./types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

interface Owner<S extends State<any, any>, WIN, ROUT, WOUT, RROUT> {
  /**Sets the state that is being proxied, and updates subscribers with new value*/
  set_state(state: S): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_read(transform: (value: StateInferResult<S>) => RROUT): void;
  /**Changes the transform function of the proxy, and updates subscribers with new value*/
  set_transform_write(
    wout_win: (val: WOUT) => WIN,
    win_wout: (val: WIN) => WOUT,
  ): void;
  readonly state: State<ROUT, WOUT, OptionNone>;
}

export type StateProxyROA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : any,
  ROUT = RIN,
  WOUT = WIN,
> = StateROA<ROUT, OptionNone, WOUT> &
  Owner<S, WIN, ROUT, WOUT, ResultOk<ROUT>> & {
    readonly read_only: StateROA<ROUT, OptionNone, WOUT>;
    readonly read_write?: StateROAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyROAW<
  S extends StateREAW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROAW<ROUT, WOUT, OptionNone> &
  Owner<S, WIN, ROUT, WOUT, ResultOk<ROUT>> & {
    readonly read_only: StateROA<ROUT, OptionNone, WOUT>;
    readonly read_write: StateROAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyROS<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : any,
  ROUT = RIN,
  WOUT = WIN,
> = StateROS<ROUT, OptionNone, WOUT> &
  Owner<S, WIN, ROUT, WOUT, ResultOk<ROUT>> & {
    readonly read_only: StateROA<ROUT, OptionNone, WOUT>;
    readonly read_write?: StateROAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyROSW<
  S extends StateRESW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateROSW<ROUT, WOUT, OptionNone> &
  Owner<S, WIN, ROUT, WOUT, ResultOk<ROUT>> & {
    readonly read_only: StateROA<ROUT, OptionNone, WOUT>;
    readonly read_write: StateROAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyREA<
  S extends State<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : any,
  ROUT = RIN,
  WOUT = WIN,
> = StateREA<ROUT, OptionNone, WOUT> &
  Owner<S, WIN, ROUT, WOUT, Result<ROUT, string>> & {
    readonly read_only: StateREA<ROUT, OptionNone, WOUT>;
    readonly read_write?: StateREAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyREAW<
  S extends StateREAW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateREAW<ROUT, WOUT, OptionNone> &
  Owner<S, WIN, ROUT, WOUT, Result<ROUT, string>> & {
    readonly read_only: StateREA<ROUT, OptionNone, WOUT>;
    readonly read_write: StateREAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyRES<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : any,
  ROUT = RIN,
  WOUT = WIN,
> = StateRES<ROUT, OptionNone, WOUT> &
  Owner<S, WIN, ROUT, WOUT, Result<ROUT, string>> & {
    readonly read_only: StateREA<ROUT, OptionNone, WOUT>;
    readonly read_write?: StateREAW<ROUT, WOUT, OptionNone>;
  };

export type StateProxyRESW<
  S extends StateRESW<RIN, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  WIN = S extends State<any, infer WT> ? WT : never,
  ROUT = RIN,
  WOUT = WIN,
> = StateRESW<ROUT, WOUT, OptionNone> &
  Owner<S, WIN, ROUT, WOUT, Result<ROUT, string>> & {
    readonly read_only: StateREA<ROUT, OptionNone, WOUT>;
    readonly read_write: StateREAW<ROUT, WOUT, OptionNone>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXXX<
  S extends State<RIN, WIN>,
  RIN,
  WIN,
  ROUT,
  WOUT,
  RROUT extends Result<ROUT, string>,
>
  extends StateBase<ROUT, WOUT, OptionNone, RROUT>
  implements Owner<S, WIN, ROUT, WOUT, RROUT>
{
  constructor(
    state: S,
    transform_read?: (value: StateInferResult<S>) => RROUT,
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
  #buffer?: RROUT;

  private transform_read(value: Result<RIN, string>): RROUT {
    return value as unknown as RROUT;
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
  set_transform_read(transform: (value: StateInferResult<S>) => RROUT) {
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
  get read_only(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }
  get read_write(): State<ROUT, WOUT, OptionNone> {
    return this as State<ROUT, WOUT, OptionNone>;
  }

  //#Reader Context
  get rok(): boolean {
    return this.#state.rok;
  }
  get rsync(): boolean {
    return this.#state.rsync;
  }
  then<T = RROUT>(func: (value: RROUT) => T | PromiseLike<T>): Promise<T> {
    try {
      if (this.#buffer) return Promise.resolve(func(this.#buffer));
      return Promise.resolve(
        this.#state.then((v) => func(this.transform_read(v))),
      );
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
  get(): RROUT {
    if (this.#buffer) return this.#buffer;
    return this.transform_read(this.#state.get!());
  }
  ok(): ROUT {
    return (this.get() as ResultOk<ROUT>).value;
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

//##################################################################################################################################################
//      _____   ____
//     |  __ \ / __ \   /\
//     | |__) | |  | | /  \
//     |  _  /| |  | |/ /\ \
//     | | \ \| |__| / ____ \
//     |_|  \_\\____/_/    \_\
/**Creates a guarenteed ok proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function roa_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?: (value: StateInferResult<S>) => ResultOk<ROUT>,
): StateProxyROA<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, ResultOk<ROUT>>(
    state,
    transform,
  ) as StateProxyROA<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____   ____     __          __
//     |  __ \ / __ \   /\ \        / /
//     | |__) | |  | | /  \ \  /\  / /
//     |  _  /| |  | |/ /\ \ \/  \/ /
//     | | \ \| |__| / ____ \  /\  /
//     |_|  \_\\____/_/    \_\/  \/

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function roaw_from<
  S extends StateREAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?: (value: StateInferResult<S>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROAW<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, ResultOk<ROUT>>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROAW<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____   ____   _____
//     |  __ \ / __ \ / ____|
//     | |__) | |  | | (___
//     |  _  /| |  | |\___ \
//     | | \ \| |__| |____) |
//     |_|  \_\\____/|_____/
/**Creates a sync proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function ros_from<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?: (value: StateInferResult<S>) => ResultOk<ROUT>,
): StateProxyROS<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, ResultOk<ROUT>>(
    state,
    transform,
  ) as StateProxyROS<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____   ____   _______          __
//     |  __ \ / __ \ / ____\ \        / /
//     | |__) | |  | | (___  \ \  /\  / /
//     |  _  /| |  | |\___ \  \ \/  \/ /
//     | | \ \| |__| |____) |  \  /\  /
//     |_|  \_\\____/|_____/    \/  \/
/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function rosw_from<
  S extends StateRESW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?: (value: StateInferResult<S>) => ResultOk<ROUT>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyROSW<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, ResultOk<ROUT>>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyROSW<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____  ______
//     |  __ \|  ____|   /\
//     | |__) | |__     /  \
//     |  _  /|  __|   / /\ \
//     | | \ \| |____ / ____ \
//     |_|  \_\______/_/    \_\
/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function rea_from<
  S extends StateREA<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?: (value: StateInferResult<S>) => Result<ROUT, string>,
): StateProxyREA<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, Result<ROUT, string>>(
    state,
    transform,
  ) as StateProxyREA<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____  ______     __          __
//     |  __ \|  ____|   /\ \        / /
//     | |__) | |__     /  \ \  /\  / /
//     |  _  /|  __|   / /\ \ \/  \/ /
//     | | \ \| |____ / ____ \  /\  /
//     |_|  \_\______/_/    \_\/  \/
/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function reaw_from<
  S extends StateREAW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?: (value: StateInferResult<S>) => Result<ROUT, string>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyREAW<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, Result<ROUT, string>>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyREAW<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____  ______  _____
//     |  __ \|  ____|/ ____|
//     | |__) | |__  | (___
//     |  _  /|  __|  \___ \
//     | | \ \| |____ ____) |
//     |_|  \_\______|_____/

/**Creates a sync proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform - Function to transform value of proxy*/
function res_from<
  S extends StateRES<RIN, any, WIN>,
  RIN = S extends State<infer RT> ? RT : never,
  ROUT = RIN,
  WIN = S extends State<any, infer RT> ? RT : any,
  WOUT = WIN,
>(
  state: S,
  transform?: (value: StateInferResult<S>) => Result<ROUT, string>,
): StateProxyRES<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, Result<ROUT, string>>(
    state,
    transform,
  ) as StateProxyRES<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      _____  ______  _______          __
//     |  __ \|  ____|/ ____\ \        / /
//     | |__) | |__  | (___  \ \  /\  / /
//     |  _  /|  __|  \___ \  \ \/  \/ /
//     | | \ \| |____ ____) |  \  /\  /
//     |_|  \_\______|_____/    \/  \/

/**Creates a proxy state which mirrors another state, with an optional transform function.
 * @param state - state to proxy.
 * @param transform_read - Function to transform value of proxy*/
function resw_from<
  S extends StateRESW<RIN, WIN>,
  RIN,
  WIN,
  ROUT = RIN,
  WOUT = WIN,
>(
  state: S,
  transform_read?: (value: StateInferResult<S>) => Result<ROUT, string>,
  transform_write?: {
    wout_win: (val: WOUT) => WIN;
    win_wout: (val: WIN) => WOUT;
  },
): StateProxyRESW<S, RIN, WIN, ROUT, WOUT> {
  return new RXXX<S, RIN, WIN, ROUT, WOUT, Result<ROUT, string>>(
    state,
    transform_read,
    transform_write,
  ) as StateProxyRESW<S, RIN, WIN, ROUT, WOUT>;
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Proxy state redirecting another state */
export const PROXY = {
  roa: roa_from,
  roaw: roaw_from,
  ros: ros_from,
  rosw: rosw_from,
  rea: rea_from,
  reaw: reaw_from,
  res: res_from,
  resw: resw_from,
};
