import {
  err,
  none,
  ok,
  ResultOk,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import { StateHelper } from "./helpers";
import { ArrayOwner, StateArrayMethods } from "./helpers/array";
import {
  StateREA,
  StateREAW,
  StateRESW,
  StateROA,
  StateROAW,
  StateROSW,
  type StateRelated as RELATED,
  type State,
  type StateRES,
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
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED>,
  WT = RT,
  H extends StateHelper<RT, WT, REL, RRT> | undefined = undefined,
> = (
  value: WT,
  state: OwnerWrite<RT, RRT, WT, REL, H>,
  old?: RRT,
) => Promise<Result<void, string>>;

interface Owner<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
  H extends StateHelper<RT, WT, REL, RRT> | undefined,
> {
  readonly helper: H;
  set(value: RRT): void;
  set_ok(value: RT): void;
  setter?: Setter<RT, RRT, REL, WT, H>;
  readonly state: State<RT, WT, REL>;
  readonly array: RT extends any[] ? StateArrayMethods<RT[number]> : never;
}
export type StateSyncROS<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateROS<RT, REL, WT> &
  Owner<RT, ResultOk<RT>, WT, REL, H> & {
    readonly read_only: StateROS<RT, REL, WT>;
    readonly read_write?: StateROSW<RT, WT, REL>;
  };

export type StateLazyROS<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateSyncROS<RT, REL, WT, H>;

export type StateSyncRES<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateRES<RT, REL, WT> &
  Owner<RT, Result<RT, string>, WT, REL, H> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, REL, WT>;
    readonly read_write?: StateRESW<RT, WT, REL>;
  };

export type StateLazyRES<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateSyncRES<RT, REL, WT, H>;

export type StateDelayedROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateROA<RT, REL, WT> &
  Owner<RT, ResultOk<RT>, WT, REL, H> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write?: StateROAW<RT, WT, REL>;
  };

export type StateDelayedREA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateREA<RT, REL, WT> &
  Owner<RT, Result<RT, string>, WT, REL, H> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write?: StateREAW<RT, WT, REL>;
  };
export interface OwnerWrite<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
  H extends StateHelper<RT, WT, REL, RRT> | undefined,
> extends Owner<RT, RRT, WT, REL, H> {
  setter: Setter<RT, RRT, REL, WT, H>;
}

export type StateSyncROSW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateROSW<RT, WT, REL> &
  OwnerWrite<RT, ResultOk<RT>, WT, REL, H> & {
    readonly read_only: StateROS<RT, REL, WT>;
    readonly read_write: StateROSW<RT, WT, REL>;
  };

export type StateLazyROSW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateSyncROSW<RT, WT, REL, H>;

export type StateSyncRESW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateRESW<RT, WT, REL> &
  OwnerWrite<RT, Result<RT, string>, WT, REL, H> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, REL, WT>;
    readonly read_write: StateRESW<RT, WT, REL>;
  };

export type StateLazyRESW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateSyncRESW<RT, WT, REL, H>;

export type StateDelayedROAW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
> = StateROAW<RT, WT, REL> &
  OwnerWrite<RT, ResultOk<RT>, WT, REL, H> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write: StateROAW<RT, WT, REL>;
  };

export type StateDelayedREAW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
  H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
    undefined,
> = StateREAW<RT, WT, REL> &
  OwnerWrite<RT, Result<RT, string>, WT, REL, H> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write: StateREAW<RT, WT, REL>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXXX<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED>,
  WT,
  H extends StateHelper<RT, WT, REL, RRT> | undefined,
>
  extends StateBase<RT, WT, REL, RRT, H>
  implements Owner<RT, RRT, WT, REL, H>
{
  constructor(
    init:
      | [0, boolean, RRT]
      | [1, boolean, () => RRT]
      | [2, boolean, (() => PromiseLike<RRT>) | undefined],
    helper: H,
    setter?: Setter<RT, RRT, REL, WT, H> | true,
  ) {
    super(helper);
    this.#rok = init[1];
    if (setter === true)
      this.#setter = (value, state, old) => {
        if (old && !old.err && (value as unknown as RT) === old.value)
          return Promise.resolve(ok(undefined));
        if (this.helper) {
          return this.helper.limit(value).then((e) => {
            if (e.err) return err(e.error);
            state.set_ok(e.value as unknown as RT);
            return ok(undefined);
          });
        }
        return Promise.resolve(ok(state.set_ok(value as unknown as RT)));
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
  #setter?: Setter<RT, RRT, REL, WT, H>;

  //#Owner Context
  set(value: RRT) {
    this.update_subs((this.#value = value));
  }
  set_ok(value: RT): void {
    this.set(ok(value) as RRT);
  }
  set_err(error: string): void {
    this.set(err(error) as RRT);
  }
  set setter(setter: Setter<RT, RRT, REL, WT, H> | undefined) {
    this.#setter = setter;
  }
  get setter(): Setter<RT, RRT, REL, WT, H> | undefined {
    return this.#setter;
  }
  get state(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_only(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_write(): State<RT, WT, REL> | undefined {
    return this.#setter ? (this as State<RT, WT, any>) : undefined;
  }

  #array?: ArrayOwner<RT extends any[] ? RT[number] : never>;
  get array(): RT extends any[] ? ArrayOwner<RT[number]> : never {
    return (this.#array ??= new ArrayOwner<
      RT extends any[] ? RT[number] : never
    >(
      () =>
        (this.#value ?? ok([] as RT)) as Result<
          (RT extends any[] ? RT[number] : never)[],
          string
        >,
      (v) => this.set(v as RRT),
    )) as RT extends any[] ? ArrayOwner<RT[number]> : never;
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
  ok(): RT {
    return (this.get() as ResultOk<RT>).value;
  }
  related(): REL {
    return this.helper?.related ? this.helper.related() : (none() as REL);
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  write(value: WT): Promise<Result<void, string>> {
    if (this.#setter)
      return Promise.resolve(
        this.#setter(
          value,
          this as OwnerWrite<RT, RRT, WT, REL, H>,
          this.#value,
        ),
      );
    return Promise.resolve(err("not writable"));
  }
  limit(value: WT): Promise<Result<WT, string>> {
    return this.helper?.limit
      ? this.helper.limit(value)
      : Promise.resolve(ok(value));
  }
  check(value: WT): Promise<Result<WT, string>> {
    return this.helper?.check
      ? this.helper.check(value)
      : Promise.resolve(ok(value));
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
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(this: void, init: RT, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [0, false, ok(init)],
      helper as H,
    ) as StateSyncROS<RT, REL, WT>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(init: ResultOk<RT>, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [0, false, init],
      helper as H,
    ) as StateSyncROS<RT, REL, WT>;
  },
};

const sync_rosw = {
  /**Creates a sync ok state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    this: void,
    init: RT,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [0, false, ok(init)],
      helper as H,
      setter,
    ) as StateSyncROSW<RT, WT, REL, H>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    init: ResultOk<RT>,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [0, false, init],
      helper as H,
      setter,
    ) as StateSyncROSW<RT, WT, REL, H>;
  },
};

const sync_res = {
  /**Creates a sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(this: void, init: RT, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, ok(init)],
      helper as H,
    ) as StateSyncRES<RT, REL, WT, H>;
  },
  /**Creates a sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(this: void, init: string, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, err(init)],
      helper as H,
    ) as StateSyncRES<RT, REL, WT, H>;
  },
  /**Creates a sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init: Result<RT, string>, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, init],
      helper as H,
    ) as StateSyncRES<RT, REL, WT, H>;
  },
};
const sync_resw = {
  /**Creates a writable sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    this: void,
    init: RT,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, ok(init)],
      helper as H,
      setter,
    ) as StateSyncRESW<RT, WT, REL, H>;
  },
  /**Creates a writable sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    this: void,
    init: string,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, err(init)],
      helper as H,
      setter,
    ) as StateSyncRESW<RT, WT, REL, H>;
  },
  /**Creates a writable sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init: Result<RT, string>,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [0, false, init],
      helper as H,
      setter,
    ) as StateSyncRESW<RT, WT, REL, H>;
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
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(init: () => RT, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [1, false, () => ok(init())],
      helper as H,
    ) as StateLazyROS<RT, REL, WT>;
  },
  /**Creates a lazy ok state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(init: () => ResultOk<RT>, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [1, false, init],
      helper as H,
    ) as StateLazyROS<RT, REL, WT>;
  },
};

const lazy_rosw = {
  /**Creates a lazy ok state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    init: () => RT,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [1, false, () => ok(init())],
      helper as H,
      setter,
    ) as StateLazyROSW<RT, WT, REL, H>;
  },
  /**Creates a lazy ok state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    init: () => ResultOk<RT>,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [1, false, init],
      helper as H,
      setter,
    ) as StateLazyROSW<RT, WT, REL, H>;
  },
};
const lazy_res = {
  /**Creates a lazy state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init: () => RT, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, () => ok(init())],
      helper as H,
    ) as StateLazyRES<RT, REL, WT, H>;
  },
  /**Creates a lazy state from an initial error, lazy meaning the value is only evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init: () => string, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, () => err(init())],
      helper as H,
    ) as StateLazyRES<RT, REL, WT, H>;
  },
  /**Creates a lazy state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init: () => Result<RT, string>, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, init],
      helper as H,
    ) as StateLazyRES<RT, REL, WT, H>;
  },
};

const lazy_resw = {
  /**Creates a writable lazy state from an initial value, lazy meaning the value is only evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init: () => RT,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, () => ok(init())],
      helper as H,
      setter,
    ) as StateLazyRESW<RT, WT, REL, H>;
  },
  /**Creates a writable lazy state from an initial error, lazy meaning the value is only evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init: () => string,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, () => err(init())],
      helper as H,
      setter,
    ) as StateLazyRESW<RT, WT, REL, H>;
  },
  /**Creates a writable lazy state from an initial result, lazy meaning the value is only evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init: () => Result<RT, string>,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [1, false, init],
      helper as H,
      setter,
    ) as StateLazyRESW<RT, WT, REL, H>;
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
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(init?: () => PromiseLike<RT>, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper as H,
    ) as StateDelayedROA<RT, REL, WT, H>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(init?: () => PromiseLike<ResultOk<RT>>, helper?: H) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [2, true, init],
      helper as H,
    ) as StateDelayedROA<RT, REL, WT, H>;
  },
};

const delayed_roaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    init?: () => PromiseLike<RT>,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper as H,
      setter,
    ) as StateDelayedROAW<RT, WT, REL, H>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
  >(
    init?: () => PromiseLike<ResultOk<RT>>,
    setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
      [2, true, init],
      helper as H,
      setter,
    ) as StateDelayedROAW<RT, WT, REL, H>;
  },
};

const delayed_rea = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init?: () => PromiseLike<RT>, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper as H,
    ) as StateDelayedREA<RT, REL, WT, H>;
  },
  /**Creates a delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init?: () => PromiseLike<string>, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init ? async () => err(await init()) : undefined],
      helper as H,
    ) as StateDelayedREA<RT, REL, WT, H>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    REL extends Option<RELATED> = Option<{}>,
    WT = any,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(init?: () => PromiseLike<Result<RT, string>>, helper?: H) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init],
      helper as H,
    ) as StateDelayedREA<RT, REL, WT, H>;
  },
};

const delayed_reaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init?: () => PromiseLike<RT>,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init ? async () => ok(await init()) : undefined],
      helper as H,
      setter,
    ) as StateDelayedREAW<RT, WT, REL, H>;
  },
  /**Creates a writable delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init?: () => PromiseLike<string>,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init ? async () => err(await init()) : undefined],
      helper as H,
      setter,
    ) as StateDelayedREAW<RT, WT, REL, H>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<
    RT,
    WT = RT,
    REL extends Option<RELATED> = Option<{}>,
    H extends StateHelper<RT, WT, REL, Result<RT, string>> | undefined =
      undefined,
  >(
    init?: () => PromiseLike<Result<RT, string>>,
    setter: Setter<RT, Result<RT, string>, REL, WT, H> | true = true,
    helper?: H,
  ) {
    return new RXXX<RT, Result<RT, string>, REL, WT, H>(
      [2, true, init],
      helper as H,
      setter,
    ) as StateDelayedREAW<RT, WT, REL, H>;
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
