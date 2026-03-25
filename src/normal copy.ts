import {
  err,
  ok,
  OptionNone,
  ResultOk,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase, StateNoHelper } from "./base";
import { NUMBER } from "./helpers/number";
import { StateHelper, StateROSW, type State, type StateROS } from "./types";

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
  WT,
  HEL extends StateHelper<RT, WT, any>,
> = (
  value: WT,
  state: Owner<RT, RRT, WT, HEL>,
  old?: RRT,
) => Promise<Result<void, string>>;

interface Owner<
  RT,
  RRT extends Result<RT, string>,
  WT,
  HEL extends StateHelper<RT, WT, any>,
> {
  readonly helper: HEL;
  set(value: RRT): void;
  set_ok(value: RT): void;
  setter?: Setter<RT, RRT, WT, HEL>;
  readonly state: State<RT, WT, ReturnType<HEL["related"]>>;
}

export type StateSyncROS<
  RT,
  WT = RT,
  HEL extends StateHelper<RT, WT, any> = StateNoHelper,
> = StateROS<RT, ReturnType<HEL["related"]>, WT> &
  Owner<RT, ResultOk<RT>, WT, HEL> & {
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write?: StateROSW<RT, WT, ReturnType<HEL["related"]>>;
  };

export type StateSyncROSW<
  RT,
  WT = RT,
  HEL extends StateHelper<RT, WT, any> = StateNoHelper,
> = StateROSW<RT, WT, ReturnType<HEL["related"]>> &
  Owner<RT, ResultOk<RT>, WT, HEL> & {
    setter: Setter<RT, ResultOk<RT>, WT, HEL>;
    readonly read_only: StateROS<RT, ReturnType<HEL["related"]>, WT>;
    readonly read_write: StateROSW<RT, WT, ReturnType<HEL["related"]>>;
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
  WT,
  HEL extends StateHelper<RT, WT, OptionNone>,
>
  extends StateBase<RT, WT, RRT, HEL>
  implements Owner<RT, RRT, WT, HEL>
{
  constructor(
    init:
      | [0, boolean, RRT]
      | [1, boolean, () => RRT]
      | [2, boolean, (() => PromiseLike<RRT>) | undefined],
    helper?: HEL,
    setter?: Setter<RT, RRT, WT, HEL> | true,
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
  #setter?: Setter<RT, RRT, WT, HEL>;

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
  set setter(setter: Setter<RT, RRT, WT, HEL> | undefined) {
    this.#setter = setter;
  }
  get setter(): Setter<RT, RRT, WT, HEL> | undefined {
    return this.#setter;
  }
  get state(): State<RT, WT, ReturnType<HEL["related"]>> {
    return this as State<RT, WT, any>;
  }
  get read_only(): State<RT, WT, ReturnType<HEL["related"]>> {
    return this as State<RT, WT, any>;
  }
  get read_write(): State<RT, WT, ReturnType<HEL["related"]>> | undefined {
    return this.#setter ? (this as State<RT, WT, any>) : undefined;
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
  related(): ReturnType<HEL["related"]> {
    return this.helper.related() as ReturnType<HEL["related"]>;
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  write(value: WT): Promise<Result<void, string>> {
    if (this.#setter)
      return Promise.resolve(
        this.#setter(value, this as Owner<RT, RRT, WT, HEL>, this.#value),
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
  ok<RT, HEL extends StateHelper<RT, WT, any> = StateNoHelper, WT = RT>(
    this: void,
    init: RT,
    helper?: HEL,
  ) {
    return new RXXX<RT, ResultOk<RT>, WT, HEL>(
      [0, false, ok(init)],
      helper,
    ) as StateSyncROS<RT, WT, HEL>;
  },
  /**Creates a sync ok state from an initial result.
   * @param init initial result for state.
   * @param helper functions to check and limit the value, and to return related states.*/
  result<RT, HEL extends StateHelper<RT, WT, any>, WT = RT>(
    init: ResultOk<RT>,
    helper?: HEL,
  ) {
    return new RXXX<RT, ResultOk<RT>, WT, HEL>(
      [0, false, init],
      helper,
    ) as StateSyncROS<RT, WT, HEL>;
  },
};

const zxcv = sync_ros.ok(5);
zxcv.related();

const zxcv2 = sync_ros.ok(5, NUMBER.helper());
zxcv2.related();
// const sync_rosw = {
//   /**Creates a sync ok state from an initial value.
//    * @param init initial value for state.
//    * @param helper functions to check and limit the value, and to return related states.*/
//   ok<
//     RT,
//     WT = RT,
//     REL extends Option<RELATED> = Option<{}>,
//     H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
//   >(
//     this: void,
//     init: RT,
//     setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
//     helper?: H,
//   ) {
//     return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
//       [0, false, ok(init)],
//       helper as H,
//       setter,
//     ) as StateSyncROSW<RT, WT, REL, H>;
//   },
//   /**Creates a sync ok state from an initial result.
//    * @param init initial result for state.
//    * @param helper functions to check and limit the value, and to return related states.*/
//   result<
//     RT,
//     WT = RT,
//     REL extends Option<RELATED> = Option<{}>,
//     H extends StateHelper<RT, WT, REL, ResultOk<RT>> | undefined = undefined,
//   >(
//     init: ResultOk<RT>,
//     setter: Setter<RT, ResultOk<RT>, REL, WT, H> | true = true,
//     helper?: H,
//   ) {
//     return new RXXX<RT, ResultOk<RT>, REL, WT, H>(
//       [0, false, init],
//       helper as H,
//       setter,
//     ) as StateSyncROSW<RT, WT, REL, H>;
//   },
// };

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
  //rosw: sync_rosw,
};
