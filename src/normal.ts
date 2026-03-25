import {
  err,
  ok,
  OptionNone,
  ResultInferOk,
  ResultOk,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase, StateNoHelper } from "./base";
import {
  StateHelper,
  StateREA,
  StateREAW,
  StateRES,
  StateRESW,
  StateROA,
  StateROAW,
  StateROSW,
  type State,
  type StateROS,
} from "./types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

type Setter<
  RRT extends Result<any, string>,
  HEL extends StateHelper<RRT, WT, any>,
  WT,
> = (
  value: WT,
  state: Owner<RRT, HEL, WT>,
  old?: RRT,
) => Promise<Result<void, string>>;

export interface Owner<
  RRT extends Result<any, string>,
  HEL extends StateHelper<RRT, WT, any>,
  WT,
> {
  readonly helper: HEL;
  set(value: RRT): void;
  set_ok(value: ResultInferOk<RRT>): void;
  setter?: Setter<RRT, HEL, WT>;
  readonly state: State<ResultInferOk<RRT>, ReturnType<HEL["related"]>, WT>;
}

export type StateNormalROS<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateROS<RT, ReturnType<HEL["related"]>, WT> &
  Owner<ResultOk<RT>, HEL, WT> & {
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write?: StateROSW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalRES<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateRES<RT, ReturnType<HEL["related"]>, WT> &
  Owner<Result<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write?: StateRESW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalROA<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateROA<RT, ReturnType<HEL["related"]>, WT> &
  Owner<ResultOk<RT>, HEL, WT> & {
    readonly read_only: StateROA<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write?: StateROAW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalREA<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateREA<RT, ReturnType<HEL["related"]>, WT> &
  Owner<Result<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write?: StateREAW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalROSW<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateROSW<RT, ReturnType<HEL["related"]>, WT> &
  Owner<ResultOk<RT>, HEL, WT> & {
    setter: Setter<ResultOk<RT>, HEL, WT>;
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write: StateROSW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalRESW<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateRESW<RT, ReturnType<HEL["related"]>, WT> &
  Owner<Result<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write: StateROSW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalROAW<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateROAW<RT, ReturnType<HEL["related"]>, WT> &
  Owner<ResultOk<RT>, HEL, WT> & {
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write: StateROSW<RT, ReturnType<HEL["related"]>, WT>;
  };

export type StateNormalREAW<
  RT,
  HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
  WT = RT,
> = StateREAW<RT, ReturnType<HEL["related"]>, WT> &
  Owner<Result<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write: StateROSW<RT, ReturnType<HEL["related"]>, WT>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXXX<
  RRT extends Result<any, string>,
  HEL extends StateHelper<RRT, WT, OptionNone>,
  WT,
>
  extends StateBase<RRT, WT, HEL>
  implements Owner<RRT, HEL, WT>
{
  constructor(
    init:
      | [0, boolean, RRT]
      | [1, boolean, () => RRT]
      | [2, boolean, (() => PromiseLike<RRT>) | undefined],
    helper?: HEL,
    setter?: Setter<RRT, HEL, WT> | true,
  ) {
    super(helper);
    this.#rok = init[1];
    if (setter === true)
      this.#setter = (value, state, old) => {
        if (old && !old.err && value === old.value)
          return Promise.resolve(ok(undefined));
        if (this.helper) {
          return this.helper.limit(value).then((e) => {
            if (e.err) return err(e.error);
            state.set_ok(e.value as ResultInferOk<RRT>);
            return ok(undefined);
          });
        }
        return Promise.resolve(ok(state.set_ok(value as ResultInferOk<RRT>)));
      };
    else this.#setter = setter;
    if (init[0] === 0) {
      this.#value = init[2];
    } else if (init[0] === 1) {
      const f = init[2];
      this.get = () => this.#clean() ?? (this.#value = f());
      this.set = (value) => this.set(this.#clean() ?? value);
      const write = this.write.bind(this);
      this.write = (value) =>
        write(value).then((val) => val.map((valu) => this.#clean() ?? valu));
    } else if (init[0] === 2) {
      const f = init[2];
      //Temporary override until first access
      let initializing = false;
      this.then = async <TResult1 = RRT>(
        func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
      ): Promise<TResult1> => {
        if (f)
          if (!initializing) {
            initializing = true;
            (async () => {
              try {
                this.#value = await f();
                this.ful_r_prom(this.#value);
              } catch (e) {
                console.error(
                  "Failed to initialize delayed RO state: ",
                  e,
                  this,
                );
              }
              this.#clean();
            })();
          }
        return this.append_r_prom(func);
      };
      this.set = (value) => {
        this.#clean();
        this.set(this.ful_r_prom(value));
      };
      const write = this.write.bind(this);
      this.write = async (value) =>
        (await write(value)).map((val) => this.#clean() ?? val);
    }
  }

  #clean(): void {
    (["then", "get", "set", "write"] as const).forEach((k) => delete this[k]);
  }

  #value?: RRT;
  #setter?: Setter<RRT, HEL, WT>;

  //#Owner Context
  set(value: RRT) {
    this.update_subs((this.#value = value));
  }
  set_ok(value: ResultInferOk<RRT>): void {
    this.set(ok(value) as RRT);
  }
  set_err(error: string): void {
    this.set(err(error) as RRT);
  }
  set setter(setter: Setter<RRT, HEL, WT> | undefined) {
    this.#setter = setter;
  }
  get setter(): Setter<RRT, HEL, WT> | undefined {
    return this.#setter;
  }
  get state() {
    return this as State<ResultInferOk<RRT>, ReturnType<HEL["related"]>, WT>;
  }
  get read_only() {
    return this as State<ResultInferOk<RRT>, ReturnType<HEL["related"]>, WT>;
  }
  get read_write() {
    return this.#setter
      ? (this as State<ResultInferOk<RRT>, ReturnType<HEL["related"]>, WT>)
      : undefined;
  }

  //#Reader Context
  #rok: boolean;
  get rok(): boolean {
    return this.#rok;
  }
  get rsync(): boolean {
    return Boolean(this.#value);
  }
  then<TResult1 = RRT>(
    func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
  ): Promise<TResult1> {
    try {
      return Promise.resolve(func(this.get()));
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
  get(): RRT {
    return this.#value!;
  }
  ok(): ResultInferOk<RRT> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (this.get() as ResultOk<ResultInferOk<RRT>>).value;
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  write(value: WT): Promise<Result<void, string>> {
    if (this.#setter)
      return Promise.resolve(
        this.#setter(value, this as Owner<RRT, HEL, WT>, this.#value),
      );
    return Promise.resolve(err("not writable"));
  }
}

//##################################################################################################################################################
//       _______     ___   _  _____
//      / ____\ \   / / \ | |/ ____|
//     | (___  \ \_/ /|  \| | |
//      \___ \  \   / | . ` | |
//      ____) |  | |  | |\  | |____
//     |_____/   |_|  |_| \_|\_____|

const sync_ros = {
  /**Creates a sync ok state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(this: void, init: RT, helper?: HEL) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [0, false, ok(init)],
      helper,
    ) as StateNormalROS<RT, HEL, WT>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, HEL extends StateHelper<ResultOk<RT>, WT, any>, WT = RT>(
    init: ResultOk<RT>,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [0, false, init],
      helper,
    ) as StateNormalROS<RT, HEL, WT>;
  },
};

const sync_rosw = {
  /**Creates a sync ok state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    this: void,
    init: RT,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [0, false, ok(init)],
      helper,
      setter,
    ) as StateNormalROSW<RT, HEL, WT>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: ResultOk<RT>,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [0, false, init],
      helper,
      setter,
    ) as StateNormalROSW<RT, HEL, WT>;
  },
};

const sync_res = {
  /**Creates a sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(this: void, init: RT, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, ok(init)],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
  /**Creates a sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(this: void, init: string, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, err(init)],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
  /**Creates a sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: Result<RT, string>, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, init],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
};
const sync_resw = {
  /**Creates a writable sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    this: void,
    init: RT,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, ok(init)],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
  /**Creates a writable sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    this: void,
    init: string,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, err(init)],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
  /**Creates a writable sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: Result<RT, string>,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [0, false, init],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
};

//##################################################################################################################################################
//      _                ________     __
//     | |        /\    |___  /\ \   / /
//     | |       /  \      / /  \ \_/ /
//     | |      / /\ \    / /    \   /
//     | |____ / ____ \  / /__    | |
//     |______/_/    \_\/_____|   |_|

const lazy_ros = {
  /**Creates a lazy ok state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: () => RT, helper?: HEL) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [1, false, () => ok(init())],
      helper,
    ) as StateNormalROS<RT, HEL, WT>;
  },
  /**Creates a lazy ok state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: () => ResultOk<RT>, helper?: HEL) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [1, false, init],
      helper,
    ) as StateNormalROS<RT, HEL, WT>;
  },
};

const lazy_rosw = {
  /**Creates a lazy ok state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: () => RT,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [1, false, () => ok(init())],
      helper,
      setter,
    ) as StateNormalROSW<RT, HEL, WT>;
  },
  /**Creates a lazy ok state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: () => ResultOk<RT>,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [1, false, init],
      helper,
      setter,
    ) as StateNormalROSW<RT, HEL, WT>;
  },
};
const lazy_res = {
  /**Creates a lazy state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: () => RT, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, () => ok(init())],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
  /**Creates a lazy state from an initial error, lazy meaning the value is only evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: () => string, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, () => err(init())],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
  /**Creates a lazy state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init: () => Result<RT, string>, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, init],
      helper,
    ) as StateNormalRES<RT, HEL, WT>;
  },
};

const lazy_resw = {
  /**Creates a writable lazy state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: () => RT,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, () => ok(init())],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
  /**Creates a writable lazy state from an initial error, lazy meaning the value is only evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: () => string,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, () => err(init())],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
  /**Creates a writable lazy state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init: () => Result<RT, string>,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [1, false, init],
      helper,
      setter,
    ) as StateNormalRESW<RT, HEL, WT>;
  },
};

//##################################################################################################################################################
//      _____  ______ _           __     ________ _____
//     |  __ \|  ____| |        /\\ \   / /  ____|  __ \
//     | |  | | |__  | |       /  \\ \_/ /| |__  | |  | |
//     | |  | |  __| | |      / /\ \\   / |  __| | |  | |
//     | |__| | |____| |____ / ____ \| |  | |____| |__| |
//     |_____/|______|______/_/    \_\_|  |______|_____/

const delayed_roa = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init?: () => PromiseLike<RT>, helper?: HEL) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper,
    ) as StateNormalROA<RT, HEL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init?: () => PromiseLike<ResultOk<RT>>, helper?: HEL) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [2, true, init],
      helper,
    ) as StateNormalROA<RT, HEL, WT>;
  },
};

const delayed_roaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init?: () => PromiseLike<RT>,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper,
      setter,
    ) as StateNormalROAW<RT, HEL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init?: () => PromiseLike<ResultOk<RT>>,
    setter: Setter<ResultOk<RT>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<ResultOk<RT>, HEL, WT>(
      [2, true, init],
      helper,
      setter,
    ) as StateNormalROAW<RT, HEL, WT>;
  },
};

const delayed_rea = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init?: () => PromiseLike<RT>, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper,
    ) as StateNormalREA<RT, HEL, WT>;
  },
  /**Creates a delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init?: () => PromiseLike<string>, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init ? async () => err(await init()) : undefined],
      helper,
    ) as StateNormalREA<RT, HEL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(init?: () => PromiseLike<Result<RT, string>>, helper?: HEL) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init],
      helper,
    ) as StateNormalREA<RT, HEL, WT>;
  },
};

const delayed_reaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init?: () => PromiseLike<RT>,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper,
      setter,
    ) as StateNormalREAW<RT, HEL, WT>;
  },
  /**Creates a writable delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init?: () => PromiseLike<string>,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init ? async () => err(await init()) : undefined],
      helper,
      setter,
    ) as StateNormalREAW<RT, HEL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    HEL extends StateHelper<ResultOk<RT>, WT, any> = StateNoHelper,
    WT = RT,
  >(
    init?: () => PromiseLike<Result<RT, string>>,
    setter: Setter<Result<RT, string>, HEL, WT> | true = true,
    helper?: HEL,
  ) {
    return new RXXX<Result<RT, string>, HEL, WT>(
      [2, true, init],
      helper,
      setter,
    ) as StateNormalREAW<RT, HEL, WT>;
  },
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/
/**Sync valueholding states */
export const SYNC = {
  /**Sync read only states with guarenteed ok*/
  ros: sync_ros,
  /**Sync read and sync write with guarenteed ok*/
  rosw: sync_rosw,
  /**Sync read only states with error */
  res: sync_res,
  /**Sync read and sync write with error */
  resw: sync_resw,
};

/**Lazy valueholding states, lazy means the given function is evaluated on first access */
export const LAZY = {
  /**Sync Read lazy states with guarenteed ok, lazy meaning the value is only evaluated on first access. */
  ros: lazy_ros,
  /**Sync Read And Sync Write lazy states with guarenteed ok, lazy meaning the value is only evaluated on first access. */
  rosw: lazy_rosw,
  /**Sync Read lazy states with error, lazy meaning the value is only evaluated on first access. */
  res: lazy_res,
  /**Sync Read And Sync Write lazy states with error, lazy meaning the value is only evaluated on first access. */
  resw: lazy_resw,
};

/**Delayed valueholding states, delayed means the given promise is evaluated on first access */
export const DELAYED = {
  /**Read only delayed states with guarenteed ok, delayed meaning the value is a promise evaluated on first access. */
  roa: delayed_roa,
  /**Read write delayed states with guarenteed ok and async write, delayed meaning the value is a promise evaluated on first access. */
  roaw: delayed_roaw,
  /**Read only delayed states with error, delayed meaning the value is a promise evaluated on first access. */
  rea: delayed_rea,
  /**Read write delayed state with error and async write, delayed meaning the value is a promise evaluated on first access. */
  reaw: delayed_reaw,
};
