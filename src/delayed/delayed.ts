import {
  err,
  none,
  ok,
  OptionNone,
  ResultOk,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import {
  type StateHelper as Helper,
  type StateRelated as RELATED,
  type State,
  type StateREA,
  type StateREAWA,
  type StateREAWS,
  type StateROA,
  type StateROAWA,
  type StateROAWS,
} from "../types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

type DelayedSetterWS<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED>,
  WT = RT,
> = (
  value: WT,
  state: OwnerWS<RT, RRT, WT, REL>,
  old?: RRT,
) => Result<void, string>;

type DelayedSetterWA<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED>,
  WT = RT,
> = (
  value: WT,
  state: OwnerWA<RT, RRT, WT, REL>,
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
  setter_sync?: DelayedSetterWS<RT, RRT, REL, WT>;
  setter_async?: DelayedSetterWA<RT, RRT, REL, WT>;
  readonly state: State<RT, WT, REL>;
}

export interface OwnerWS<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
> extends Owner<RT, RRT, WT, REL> {
  setter_sync: DelayedSetterWS<RT, RRT, REL, WT>;
}

export interface OwnerWA<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
> extends Owner<RT, RRT, WT, REL> {
  setter_async: DelayedSetterWA<RT, RRT, REL, WT>;
}

export type StateDelayedROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROA<RT, REL, WT> &
  Owner<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write_sync?: StateROAWS<RT, WT, REL>;
    readonly read_write_async?: StateROAWA<RT, WT, REL>;
  };

export type StateDelayedROAWS<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROAWS<RT, WT, REL> &
  OwnerWS<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write_sync: StateROAWS<RT, WT, REL>;
    readonly read_write_async?: StateROAWA<RT, WT, REL>;
  };

export type StateDelayedROAWA<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROAWA<RT, WT, REL> &
  OwnerWA<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write_sync?: StateROAWS<RT, WT, REL>;
    readonly read_write_async: StateROAWA<RT, WT, REL>;
  };

export type StateDelayedREA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateREA<RT, REL, WT> &
  Owner<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write_sync?: StateREAWS<RT, WT, REL>;
    readonly read_write_async?: StateREAWA<RT, WT, REL>;
  };

export type StateDelayedREAWS<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateREAWS<RT, WT, REL> &
  OwnerWS<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write_sync: StateREAWS<RT, WT, REL>;
    readonly read_write_async?: StateREAWA<RT, WT, REL>;
  };

export type StateDelayedREAWA<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateREAWA<RT, WT, REL> &
  OwnerWA<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write_sync?: StateREAWS<RT, WT, REL>;
    readonly read_write_async: StateREAWA<RT, WT, REL>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXA<
  RT,
  RRT extends Result<RT, string>,
  REL extends Option<RELATED> = OptionNone,
  WT = any,
>
  extends StateBase<RT, WT, REL, RRT>
  implements Owner<RT, RRT, WT, REL>
{
  constructor(
    init?: () => PromiseLike<RRT>,
    helper?: Helper<WT, REL>,
    setter_sync?: DelayedSetterWS<RT, RRT, REL, WT> | true,
    setter_async?: DelayedSetterWA<RT, RRT, REL, WT> | true,
  ) {
    super();

    //############
    //Sync setter
    if (setter_sync === true)
      this.#setter_sync = (value, state, old) => {
        if (old && !old.err && (value as unknown as RT) === old.value)
          return ok(undefined);
        return this.#helper?.limit
          ? this.#helper
              ?.limit(value)
              .map((e) => state.set_ok(e as unknown as RT))
          : ok(state.set_ok(value as unknown as RT));
      };
    else this.#setter_sync = setter_sync;

    //############
    //Async setter
    if (setter_async === true)
      this.#setter_async = async (value, state, old) => {
        if (old && !old.err && (value as unknown as RT) === old.value)
          return ok(undefined);
        return this.#helper?.limit
          ? this.#helper
              ?.limit(value)
              .map((e) => state.set_ok(e as unknown as RT))
          : ok(state.set_ok(value as unknown as RT));
      };
    else this.#setter_async = setter_async;

    //############
    //Reader initialization
    if (helper) this.#helper = helper;
    //Temporary override until first access
    let initializing = false;
    this.then = async <TResult1 = RRT>(
      func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
    ): Promise<TResult1> => {
      if (init)
        if (!initializing) {
          initializing = true;
          (async () => {
            try {
              this.#value = await init();
              this.ful_r_prom(this.#value);
            } catch (e) {
              console.error("Failed to initialize delayed RO state: ", e, this);
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

    const write_sync = this.write_sync.bind(this);
    this.write_sync = (value) =>
      write_sync(value).map((val) => this.#clean() ?? val);

    const write = this.write.bind(this);
    this.write = async (value) =>
      (await write(value)).map((val) => this.#clean() ?? val);
  }

  #clean(): void {
    (["then", "set", "write", "write_sync"] as const).forEach(
      (k) => delete this[k],
    );
  }

  #value?: RRT;
  #setter_sync?: DelayedSetterWS<RT, RRT, REL, WT>;
  #setter_async?: DelayedSetterWA<RT, RRT, REL, WT>;
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
  set setter_sync(setter: DelayedSetterWS<RT, RRT, REL, WT> | undefined) {
    this.#setter_sync = setter;
  }
  get setter_sync(): DelayedSetterWS<RT, RRT, REL, WT> | undefined {
    return this.#setter_sync;
  }
  set setter_async(setter: DelayedSetterWA<RT, RRT, REL, WT> | undefined) {
    this.#setter_async = setter;
  }
  get setter_async(): DelayedSetterWA<RT, RRT, REL, WT> | undefined {
    return this.#setter_async;
  }

  get state(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_only(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_write_sync(): State<RT, WT, REL> | undefined {
    return this.#setter_sync ? (this as State<RT, WT, any>) : undefined;
  }
  get read_write_async(): State<RT, WT, REL> | undefined {
    return this.#setter_async ? (this as State<RT, WT, any>) : undefined;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  //Becomes sync compatible once evaluated
  get rsync(): boolean {
    return Boolean(this.#value);
  }
  get(): RRT {
    return this.#value!;
  }
  ok(): RT {
    return (this.#value! as ResultOk<RT>).value;
  }
  async then<TResult1 = RRT>(
    func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
  ): Promise<TResult1> {
    return func(this.#value!);
  }
  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }

  //#Writer Context
  get writable(): boolean {
    return Boolean(this.#setter_sync || this.#setter_async);
  }
  get wsync(): boolean {
    return Boolean(this.#setter_sync);
  }
  async write(value: WT): Promise<Result<void, string>> {
    if (this.#setter_async)
      return this.#setter_async(
        value,
        this as OwnerWA<RT, RRT, WT, REL>,
        this.#value,
      );
    else if (this.#setter_sync)
      return this.#setter_sync(
        value,
        this as OwnerWS<RT, RRT, WT, REL>,
        this.#value,
      );
    return err("State not writable");
  }
  write_sync(value: WT): Result<void, string> {
    if (this.#setter_sync)
      return this.#setter_sync(
        value,
        this as OwnerWS<RT, RRT, WT, REL>,
        this.#value,
      );
    return err("State not writable");
  }
  limit(value: WT): Result<WT, string> {
    return this.#helper?.limit ? this.#helper.limit(value) : ok(value);
  }
  check(value: WT): Result<WT, string> {
    return this.#helper?.check ? this.#helper.check(value) : ok(value);
  }
}

//##################################################################################################################################################
//       _____ ______ _   _ ______ _____         _______ ____  _____   _____
//      / ____|  ____| \ | |  ____|  __ \     /\|__   __/ __ \|  __ \ / ____|
//     | |  __| |__  |  \| | |__  | |__) |   /  \  | | | |  | | |__) | (___
//     | | |_ |  __| | . ` |  __| |  _  /   / /\ \ | | | |  | |  _  / \___ \
//     | |__| | |____| |\  | |____| | \ \  / ____ \| | | |__| | | \ \ ____) |
//      \_____|______|_| \_|______|_|  \_\/_/    \_\_|  \____/|_|  \_\_____/

const roa = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init?: () => PromiseLike<RT>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
    ) as StateDelayedROA<RT, REL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init?: () => PromiseLike<ResultOk<RT>>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(init, helper) as StateDelayedROA<
      RT,
      REL,
      WT
    >;
  },
};
const roa_ws = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetterWS<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedROAWS<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<ResultOk<RT>>,
    setter: DelayedSetterWS<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateDelayedROAWS<RT, WT, REL>;
  },
};

const roa_wa = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetterWA<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      undefined,
      setter,
    ) as StateDelayedROAWA<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<ResultOk<RT>>,
    setter: DelayedSetterWA<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init,
      helper,
      undefined,
      setter,
    ) as StateDelayedROAWA<RT, WT, REL>;
  },
};

const rea = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init?: () => PromiseLike<RT>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
    ) as StateDelayedREA<RT, REL, WT>;
  },
  /**Creates a delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init?: () => PromiseLike<string>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => err(await init()) : undefined,
      helper,
    ) as StateDelayedREA<RT, REL, WT>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    init?: () => PromiseLike<Result<RT, string>>,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
    ) as StateDelayedREA<RT, REL, WT>;
  },
};
const rea_ws = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetterWS<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedREAWS<RT, WT, REL>;
  },
  /**Creates a writable delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<string>,
    setter: DelayedSetterWS<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => err(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedREAWS<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<Result<RT, string>>,
    setter: DelayedSetterWS<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateDelayedREAWS<RT, WT, REL>;
  },
};

const rea_wa = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetterWA<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      undefined,
      setter,
    ) as StateDelayedREAWA<RT, WT, REL>;
  },
  /**Creates a writable delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<string>,
    setter: DelayedSetterWA<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => err(await init()) : undefined,
      helper,
      undefined,
      setter,
    ) as StateDelayedREAWA<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<Result<RT, string>>,
    setter: DelayedSetterWA<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
      undefined,
      setter,
    ) as StateDelayedREAWA<RT, WT, REL>;
  },
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/
/**Delayed valueholding states, delayed means the given promise is evaluated on first access */
export const STATE_DELAYED = {
  /**Read only delayed states with guarenteed ok, delayed meaning the value is a promise evaluated on first access. */
  roa,
  /**Read write delayed states with guarenteed ok and sync write, delayed meaning the value is a promise evaluated on first access. */
  roa_ws,
  /**Read write delayed states with guarenteed ok and async write, delayed meaning the value is a promise evaluated on first access. */
  roa_wa,
  /**Read only delayed states with error, delayed meaning the value is a promise evaluated on first access. */
  rea,
  /**Read write delayed states with error and sync write, delayed meaning the value is a promise evaluated on first access. */
  rea_ws,
  /**Read write delayed state with error and async write, delayed meaning the value is a promise evaluated on first access. */
  rea_wa,
};
