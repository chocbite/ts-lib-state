import {
  err,
  none,
  ok,
  RESULT_KEY,
  ResultOk,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import { type StateHelper as Helper } from "../helpers";
import {
  StateRESW,
  StateROSW,
  type StateRelated as RELATED,
  type State,
  type StateRES,
  type StateROS,
} from "../types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

type SyncSetter<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED>,
  WT = RT,
> = (
  value: WT,
  state: OwnerWrite<RT, RRT, WT, REL>,
  old?: RRT,
) => Promise<Result<void, string>>;

interface Owner<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
> {
  set(value: RRT): void;
  set_ok(value: RT): void;
  setter?: SyncSetter<RT, RRT, REL, WT>;
  readonly state: State<RT, WT, REL>;
}
export interface OwnerWrite<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
> extends Owner<RT, RRT, WT, REL> {
  setter: SyncSetter<RT, RRT, REL, WT>;
}

export type StateSyncROS<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROS<RT, REL, WT> &
  Owner<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROS<RT, REL, WT>;
    readonly read_write?: StateROSW<RT, WT, REL>;
  };

export type StateSyncROSW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROSW<RT, WT, REL> &
  OwnerWrite<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROS<RT, REL, WT>;
    readonly read_write: StateROSW<RT, WT, REL>;
  };

export type StateSyncRES<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateRES<RT, REL, WT> &
  Owner<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, REL, WT>;
    readonly read_write?: StateRESW<RT, WT, REL>;
  };

export type StateSyncRESW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateRESW<RT, WT, REL> &
  OwnerWrite<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, REL, WT>;
    readonly read_write: StateRESW<RT, WT, REL>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXS<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
>
  extends StateBase<RT, WT, REL, RRT>
  implements Owner<RT, RRT, WT, REL>
{
  constructor(
    init: RRT | (() => RRT),
    helper?: Helper<WT, REL>,
    setter?: SyncSetter<RT, RRT, REL, WT> | true,
  ) {
    super();
    if (setter === true)
      this.#setter = (value, state, old) => {
        if (old && !old.err && (value as unknown as RT) === old.value)
          return Promise.resolve(ok(undefined));
        if (this.#helper) {
          return this.#helper.limit(value).then((e) => {
            if (e.err) return err(e.error);
            state.set_ok(e.value as unknown as RT);
            return ok(undefined);
          });
        }
        return Promise.resolve(ok(state.set_ok(value as unknown as RT)));
      };
    else this.#setter = setter;
    if (helper) this.#helper = helper;
    if (init[RESULT_KEY]) {
      this.#value = init;
    } else {
      this.get = () => this.#clean() ?? (this.#value = init());
      this.set = (value) => this.set(this.#clean() ?? value);
      const write = this.write.bind(this);
      this.write = (value) =>
        write(value).then((val) => val.map((valu) => this.#clean() ?? valu));
    }
  }

  #clean(): void {
    (["get", "set", "write"] as const).forEach((k) => delete this[k]);
  }

  #value?: RRT;
  #setter?: SyncSetter<RT, RRT, REL, WT>;
  #helper?: Helper<WT, REL>;

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
  set setter(setter: SyncSetter<RT, RRT, REL, WT> | undefined) {
    this.#setter = setter;
  }
  get setter(): SyncSetter<RT, RRT, REL, WT> | undefined {
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

  //#Reader Context
  get rok(): boolean {
    return this.#value.ok;
  }
  get rsync(): boolean {
    return Boolean(this.#value);
  }
  async then<TResult1 = RRT>(
    func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
  ): Promise<TResult1> {
    return func(this.#value!);
  }
  get(): RRT {
    return this.#value!;
  }
  ok(): RT {
    return (this.#value as ResultOk<RT>).value;
  }
  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  write(value: WT): Promise<Result<void, string>> {
    if (this.#setter)
      return Promise.resolve(
        this.#setter(value, this as OwnerWrite<RT, RRT, WT, REL>, this.#value),
      );
    return Promise.resolve(err("not writable"));
  }
  limit(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.limit
      ? this.#helper.limit(value)
      : Promise.resolve(ok(value));
  }
  check(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.check
      ? this.#helper.check(value)
      : Promise.resolve(ok(value));
  }
}

//##################################################################################################################################################
//       _____ ______ _   _ ______ _____         _______ ____  _____   _____
//      / ____|  ____| \ | |  ____|  __ \     /\|__   __/ __ \|  __ \ / ____|
//     | |  __| |__  |  \| | |__  | |__) |   /  \  | | | |  | | |__) | (___
//     | | |_ |  __| | . ` |  __| |  _  /   / /\ \ | | | |  | |  _  / \___ \
//     | |__| | |____| |\  | |____| | \ \  / ____ \| | | |__| | | \ \ ____) |
//      \_____|______|_| \_|______|_|  \_\/_/    \_\_|  \____/|_|  \_\_____/

const ros = {
  /**Creates a sync ok state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    this: void,
    init: RT,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, ResultOk<RT>, REL, WT>(ok(init), helper) as StateSyncROS<
      RT,
      REL,
      WT
    >;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init: ResultOk<RT>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, ResultOk<RT>, REL, WT>(init, helper) as StateSyncROS<
      RT,
      REL,
      WT
    >;
  },
};

const ros_ws = {
  /**Creates a sync ok state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    this: void,
    init: RT,
    setter: SyncSetter<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, ResultOk<RT>, REL, WT>(
      ok(init),
      helper,
      setter,
    ) as StateSyncROSW<RT, WT, REL>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init: ResultOk<RT>,
    setter: SyncSetter<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, ResultOk<RT>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateSyncROSW<RT, WT, REL>;
  },
};

const res = {
  /**Creates a sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    this: void,
    init: RT,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      ok(init),
      helper,
    ) as StateSyncRES<RT, REL, WT>;
  },
  /**Creates a sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    this: void,
    init: string,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      err(init),
      helper,
    ) as StateSyncRES<RT, REL, WT>;
  },
  /**Creates a sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init: Result<RT, string>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
    ) as StateSyncRES<RT, REL, WT>;
  },
};
const res_ws = {
  /**Creates a writable sync state from an initial value.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    this: void,
    init: RT,
    setter: SyncSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      ok(init),
      helper,
      setter,
    ) as StateSyncRESW<RT, WT, REL>;
  },
  /**Creates a writable sync state from an initial error.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    this: void,
    init: string,
    setter: SyncSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      err(init),
      helper,
      setter,
    ) as StateSyncRESW<RT, WT, REL>;
  },
  /**Creates a writable sync state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init: Result<RT, string>,
    setter: SyncSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXS<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateSyncRESW<RT, WT, REL>;
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
export const STATE_SYNC = {
  /**Sync read only states with guarenteed ok*/
  ros,
  /**Sync read and sync write with guarenteed ok*/
  ros_ws,
  /**Sync read only states with error */
  res,
  /**Sync read and sync write with error */
  res_ws,
};
