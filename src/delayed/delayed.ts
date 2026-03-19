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
import { type StateHelper as Helper } from "../helpers";
import {
  type StateRelated as RELATED,
  type State,
  type StateREA,
  type StateREAW,
  type StateROA,
  type StateROAW,
} from "../types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

type DelayedSetter<
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
  setter?: DelayedSetter<RT, RRT, REL, WT>;
  readonly state: State<RT, WT, REL>;
}

export interface OwnerWrite<
  RT,
  RRT extends Result<RT, string>,
  WT,
  REL extends Option<RELATED>,
> extends Owner<RT, RRT, WT, REL> {
  setter: DelayedSetter<RT, RRT, REL, WT>;
}

export type StateDelayedROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROA<RT, REL, WT> &
  Owner<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write?: StateROAW<RT, WT, REL>;
  };

export type StateDelayedROAW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROAW<RT, WT, REL> &
  OwnerWrite<RT, ResultOk<RT>, WT, REL> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write: StateROAW<RT, WT, REL>;
  };

export type StateDelayedREA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateREA<RT, REL, WT> &
  Owner<RT, Result<RT, string>, WT, REL> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write?: StateREAW<RT, WT, REL>;
  };

export type StateDelayedREAW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
> = StateREAW<RT, WT, REL> &
  OwnerWrite<RT, Result<RT, string>, WT, REL> & {
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
    setter?: DelayedSetter<RT, RRT, REL, WT> | true,
  ) {
    super();

    if (setter === true)
      this.#setter = async (value, state, old) => {
        if (old && !old.err && (value as unknown as RT) === old.value)
          return Promise.resolve(ok(undefined));
        return this.#helper
          ? this.#helper.limit(value).then((e) => {
              if (e.err) return err(e.error);
              state.set_ok(e as unknown as RT);
              return ok(undefined);
            })
          : Promise.resolve(ok(state.set_ok(value as unknown as RT)));
      };
    else this.#setter = setter;

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
    const write = this.write.bind(this);
    this.write = async (value) =>
      (await write(value)).map((val) => this.#clean() ?? val);
  }

  #clean(): void {
    (["then", "set", "write"] as const).forEach((k) => delete this[k]);
  }

  #value?: RRT;
  #setter?: DelayedSetter<RT, RRT, REL, WT>;
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
  set setter(setter: DelayedSetter<RT, RRT, REL, WT> | undefined) {
    this.#setter = setter;
  }
  get setter(): DelayedSetter<RT, RRT, REL, WT> | undefined {
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
  then<TResult1 = RRT>(
    func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
  ): Promise<TResult1> {
    return Promise.resolve(func(this.#value!));
  }
  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }

  //#Writer Context
  get writable(): boolean {
    return Boolean(this.#setter);
  }
  write(value: WT): Promise<Result<void, string>> {
    if (this.#setter)
      return this.#setter(
        value,
        this as OwnerWrite<RT, RRT, WT, REL>,
        this.#value,
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

const roaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetter<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedROAW<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<ResultOk<RT>>,
    setter: DelayedSetter<RT, ResultOk<RT>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, ResultOk<RT>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateDelayedROAW<RT, WT, REL>;
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

const reaw = {
  /**Creates a delayed ok state from an initial value, delayed meaning the value is a promise evaluated on first access.
   * @param init initial value for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  ok<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<RT>,
    setter: DelayedSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => ok(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedREAW<RT, WT, REL>;
  },
  /**Creates a writable delayed state from an initial error, delayed meaning the value is a promise evaluated on first access.
   * @param init initial error for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  err<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<string>,
    setter: DelayedSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init ? async () => err(await init()) : undefined,
      helper,
      setter,
    ) as StateDelayedREAW<RT, WT, REL>;
  },
  /**Creates a delayed ok state from an initial result, delayed meaning the value is a promise evaluated on first access.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>(
    init?: () => PromiseLike<Result<RT, string>>,
    setter: DelayedSetter<RT, Result<RT, string>, REL, WT> | true = true,
    helper?: Helper<WT, REL>,
  ) {
    return new RXA<RT, Result<RT, string>, REL, WT>(
      init,
      helper,
      setter,
    ) as StateDelayedREAW<RT, WT, REL>;
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
  /**Read write delayed states with guarenteed ok and async write, delayed meaning the value is a promise evaluated on first access. */
  roaw,
  /**Read only delayed states with error, delayed meaning the value is a promise evaluated on first access. */
  rea,
  /**Read write delayed state with error and async write, delayed meaning the value is a promise evaluated on first access. */
  reaw,
};
