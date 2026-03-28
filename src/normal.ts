import {
  err,
  none,
  ok,
  OptionNone,
  ResultInferOk as RIOK,
  ResultOk as RO,
  type Result as R,
} from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import { StateArrayWrite } from "./helpers/array";
import { StateNoHelper as NoHelper, StateHelperBase } from "./helpers/helpers";
import { StateObjectWrite } from "./helpers/object";
import {
  StateHelper as Helper,
  HelperRelated as HELToREL,
  StateResult as SR,
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

type WriteType<WT> = WT extends any[]
  ? StateArrayWrite<WT[number]>
  : WT extends object
    ? StateObjectWrite<WT>
    : WT;

type Setter<
  RRT extends R<any, string>,
  HEL extends Helper<RRT, WT, any>,
  WT,
> = (
  value: WriteType<WT>,
  state: Owner<RRT, HEL, WT>,
  old?: RRT,
) => Promise<R<void, string>>;

export interface Owner<
  RRT extends R<any, string>,
  HEL extends Helper<RRT, WT, any>,
  WT,
> {
  readonly helper: HEL;
  /**Changes state value */
  set(value: RRT): void;
  /**Changes state value to a ResultOk value */
  set_ok(value: RIOK<RRT>): void;
  /**Changes state setter function, if done on a none writable state, it will become writable */
  setter?: Setter<RRT, HEL, WT>;
  /**Gets normal state as a simple state type */
  readonly state: State<RIOK<RRT>, HELToREL<HEL>, WT>;
  /**Sets a function to be called when the state is initially subscribed to */
  set_onsub(func: () => void): void;
  /**Sets a function to be called when the state is terminally unsubscribed from */
  set_onunsub(func: () => void): void;
}

export type StateNormalROS<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateROS<RT, HELToREL<HEL>, WT> &
  Owner<RO<RT>, HEL, WT> & {
    readonly read_only: StateROS<RT, HELToREL<HEL>, WT>;
    readonly read_write?: StateROSW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalRES<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateRES<RT, HELToREL<HEL>, WT> &
  Owner<R<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateRES<RT, HELToREL<HEL>, WT>;
    readonly read_write?: StateRESW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalROA<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateROA<RT, HELToREL<HEL>, WT> &
  Owner<RO<RT>, HEL, WT> & {
    readonly read_only: StateROA<RT, HELToREL<HEL>, WT>;
    readonly read_write?: StateROAW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalREA<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateREA<RT, HELToREL<HEL>, WT> &
  Owner<R<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateREA<RT, HELToREL<HEL>, WT>;
    readonly read_write?: StateREAW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalROSW<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateROSW<RT, HELToREL<HEL>, WT> &
  Owner<RO<RT>, HEL, WT> & {
    setter: Setter<RO<RT>, HEL, WT>;
    readonly read_only: StateROS<RT, HELToREL<HEL>, WT>;
    readonly read_write: StateROSW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalRESW<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateRESW<RT, HELToREL<HEL>, WT> &
  Owner<R<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateROS<RT, HELToREL<HEL>, WT>;
    readonly read_write: StateROSW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalROAW<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateROAW<RT, HELToREL<HEL>, WT> &
  Owner<RO<RT>, HEL, WT> & {
    readonly read_only: StateROS<RT, HELToREL<HEL>, WT>;
    readonly read_write: StateROSW<RT, HELToREL<HEL>, WT>;
  };

export type StateNormalREAW<
  RT,
  HEL extends Helper<RO<RT>, WT, any> = any,
  WT = RT,
> = StateREAW<RT, HELToREL<HEL>, WT> &
  Owner<R<RT, string>, HEL, WT> & {
    set_err(error: string): void;
    readonly read_only: StateROS<RT, HELToREL<HEL>, WT>;
    readonly read_write: StateROSW<RT, HELToREL<HEL>, WT>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXXX<
  RRT extends R<any, string>,
  HEL extends Helper<RRT, WT, OptionNone>,
  WT,
>
  extends StateBase<RRT, WriteType<WT>, HELToREL<HEL>>
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
    super();
    if (helper)
      this.#helper = helper as unknown as StateHelperBase<any, any, any>;
    this.#rok = init[1];
    if (setter === true)
      this.#setter = (value, state, old) => {
        if (old && !old.err && value === old.value)
          return Promise.resolve(ok(undefined));
        if (this.#helper) {
          return this.#helper.limit(value).then((e) => {
            if (e.err) return err(e.error);
            state.set_ok(e.value as RIOK<RRT>);
            return ok(undefined);
          });
        }
        return Promise.resolve(ok(state.set_ok(value as RIOK<RRT>)));
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

  #helper?: StateHelperBase<any, any, any>;
  get helper(): HEL {
    return this.#helper as unknown as HEL;
  }

  #value?: RRT;
  #setter?: Setter<RRT, HEL, WT>;

  //#Owner Context
  set(value: RRT) {
    this.update_subs((this.#value = value));
  }
  set_ok(value: RIOK<RRT>): void {
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
    return this as State<RIOK<RRT>, HELToREL<HEL>, WT>;
  }
  get read_only() {
    return this as State<RIOK<RRT>, HELToREL<HEL>, WT>;
  }
  get read_write() {
    return this.#setter
      ? (this as State<RIOK<RRT>, HELToREL<HEL>, WT>)
      : undefined;
  }
  set_onsub(func: () => void): void {
    this.on_sub = func;
  }
  set_onunsub(func: () => void): void {
    this.on_unsub = func;
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
  ok(): RIOK<RRT> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (this.get() as RO<RIOK<RRT>>).value;
  }
  related(): HELToREL<HEL> {
    return (this.#helper?.related() ?? none()) as HELToREL<HEL>;
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  write(value: WriteType<WT>): Promise<R<void, string>> {
    if (this.#setter) {
      return Promise.resolve(
        this.#setter(value, this as Owner<RRT, HEL, WT>, this.#value),
      );
    }
    return Promise.resolve(err("not writable"));
  }
  limit(value: WriteType<WT>): Promise<R<WriteType<WT>, string>> {
    return this.#helper?.limit(value) ?? Promise.resolve(ok(value));
  }
  check(value: WriteType<WT>): Promise<R<WriteType<WT>, string>> {
    return this.#helper?.check(value) ?? Promise.resolve(ok(value));
  }

  protected update_subs(value: RRT): void {
    this.#helper?.on_update_subs(value);
    super.update_subs(value);
  }
}

//##################################################################################################################################################
//       _______     ___   _  _____
//      / ____\ \   / / \ | |/ ____|
//     | (___  \ \_/ /|  \| | |
//      \___ \  \   / | . ` | |
//      ____) |  | |  | |\  | |____
//     |_____/   |_|  |_| \_|\_____|

/**Creates a sync ok state from an initial result.
 * @param init initial result for state or helper.*/
export function ros<
  RT,
  WT = RT,
  HEL extends Helper<RO<RT>, WT, any> = NoHelper,
>(init: (RO<RT> | (() => RO<RT>)) | [RO<RT> | (() => RO<RT>), HEL]) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<RO<RT>, HEL, WT>(
    typeof i === "function" ? [1, false, i] : [0, false, i],
    h,
  ) as StateNormalROS<RT, HEL, WT>;
}

/**Creates a sync ok state from an initial result.
 * @param init initial result for state or helper.*/
export function rosw<
  RT,
  WT = RT,
  HEL extends Helper<RO<RT>, WT, any> = NoHelper,
>(
  init: (RO<RT> | (() => RO<RT>)) | [RO<RT> | (() => RO<RT>), HEL],
  setter: Setter<RO<RT>, HEL, WT> | true = true,
) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<RO<RT>, HEL, WT>(
    typeof i === "function" ? [1, false, i] : [0, false, i],
    h,
    setter,
  ) as StateNormalROSW<RT, HEL, WT>;
}

/**Creates a sync state from an initial result.
 * @param init initial result for state.
 * @param helper functions to check and limit the value, and to return related states.*/
export function res<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(init: (SR<RT> | (() => SR<RT>)) | [SR<RT> | (() => SR<RT>), HEL]) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>(
    typeof i === "function" ? [1, false, i] : [0, false, i],
    h,
  ) as StateNormalRES<RT, HEL, WT>;
}

/**Creates a writable sync state from an initial result.
 * @param init initial result for state.
 * @param helper functions to check and limit the value, and to return related states.*/
export function resw<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(
  init: (SR<RT> | (() => SR<RT>)) | [SR<RT> | (() => SR<RT>), HEL],
  setter: Setter<SR<RT>, HEL, WT> | true = true,
) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>(
    typeof i === "function" ? [1, false, i] : [0, false, i],
    h,
    setter,
  ) as StateNormalRESW<RT, HEL, WT>;
}

/**Creates a sync ok state from an initial result.
 * @param init initial result for state or helper.*/
export function roa<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(init?: (() => Promise<SR<RT>>) | [() => Promise<SR<RT>>, HEL]) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>([2, true, i], h) as StateNormalROA<
    RT,
    HEL,
    WT
  >;
}

/**Creates a sync ok state from an initial result.
 * @param init initial result for state or helper.*/
export function roaw<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(
  init?: (() => Promise<SR<RT>>) | [() => Promise<SR<RT>>, HEL],
  setter: Setter<SR<RT>, HEL, WT> | true = true,
) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>([2, true, i], h, setter) as StateNormalROAW<
    RT,
    HEL,
    WT
  >;
}

/**Creates a sync state from an initial result.
 * @param init initial result for state.
 * @param helper functions to check and limit the value, and to return related states.*/
export function rea<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(init?: (() => Promise<SR<RT>>) | [() => Promise<SR<RT>>, HEL]) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>([2, true, i], h) as StateNormalREA<
    RT,
    HEL,
    WT
  >;
}

/**Creates a writable sync state from an initial result.
 * @param init initial result for state.
 * @param helper functions to check and limit the value, and to return related states.*/
export function reaw<
  RT,
  WT = RT,
  HEL extends Helper<SR<RT>, WT, any> = NoHelper,
>(
  init?: (() => Promise<SR<RT>>) | [() => Promise<SR<RT>>, HEL],
  setter: Setter<SR<RT>, HEL, WT> | true = true,
) {
  const [i, h] = Array.isArray(init) ? [init[0], init[1]] : [init, undefined];
  return new RXXX<SR<RT>, HEL, WT>([2, true, i], h, setter) as StateNormalREAW<
    RT,
    HEL,
    WT
  >;
}
