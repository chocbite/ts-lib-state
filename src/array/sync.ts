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
import { type StateHelper as HELPER } from "../helpers";
import { STATE_SYNC, type StateSyncROS } from "../sync/sync";
import type {
  StateRelated as RELATED,
  StateArray,
  StateArrayRES,
  StateArrayRESW,
  StateArrayROS,
  StateArrayROSW,
  StateRES,
  StateRESW,
  StateROS,
  StateROSW,
  StateSetREXWS,
} from "../types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

const STATE_ARRAY_KEY = Symbol("is_state_array");

export type StateArrayWrite<TYPE> =
  | { type: "write"; items: readonly TYPE[] }
  | { type: "change"; index: number; item: TYPE }
  | { type: "push"; items: readonly TYPE[] }
  | { type: "unshift"; items: readonly TYPE[] }
  | { type: "pop" }
  | { type: "shift" }
  | { type: "delete"; item: TYPE }
  | {
      type: "splice";
      index: number;
      delete_count: number;
      items?: readonly TYPE[];
    };

export const StateArrayReadType = {
  added: "added",
  removed: "removed",
  changed: "changed",
  fresh: "fresh",
} as const;
export type StateArrayReadType =
  (typeof StateArrayReadType)[keyof typeof StateArrayReadType];

export interface StateArrayRead<TYPE> {
  array: readonly TYPE[];
  type: StateArrayReadType;
  index: number;
  items: readonly TYPE[];
}

type SAR<AT> = StateArrayRead<AT>;
type SAW<AT> = StateArrayWrite<AT>;

type ArraySetter<
  AT,
  RRT extends Result<SAR<AT>, string>,
  REL extends Option<RELATED>,
> = (
  value: SAW<AT>,
  state: OwnerWS<AT, RRT, REL>,
  old?: RRT,
) => Result<void, string>;

interface Owner<
  AT,
  RRT extends Result<SAR<AT>, string>,
  REL extends Option<RELATED>,
> {
  set(value: ResultOk<AT[]>): void;
  set_ok(value: AT[]): void;
  setter?: ArraySetter<AT, RRT, REL>;

  get array(): readonly AT[];
  readonly length: number;
  readonly length_state: StateROS<number>;
  at(index: number): AT | undefined;
  set_index(index: number, value: AT): void;
  push(...items: AT[]): number;
  pop(): AT | undefined;
  shift(): AT | undefined;
  unshift(...items: AT[]): number;
  splice(start: number, deleteCount?: number, ...items: AT[]): AT[];
  delete(val: AT): void;

  apply_read<B>(
    result: ResultOk<SAR<B>>,
    transform: (val: readonly B[], type: StateArrayReadType) => AT[],
  ): void;
}

export interface OwnerWS<
  AT,
  RRT extends Result<SAR<AT>, string>,
  REL extends Option<RELATED>,
> extends Owner<AT, RRT, REL> {
  setter: ArraySetter<AT, RRT, REL>;
}

export type StateArraySyncROS<
  AT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROS<SAR<AT>, REL, SAW<AT>> &
  Owner<AT, ResultOk<SAR<AT>>, REL> & {
    readonly state: StateArray<AT, REL>;
    readonly read_only: StateArrayROS<AT, REL>;
    readonly read_write?: StateArrayROSW<AT, REL>;
  };

export type StateArraySyncROSWS<
  AT,
  REL extends Option<RELATED> = Option<{}>,
> = StateROSW<SAR<AT>, SAW<AT>, REL> &
  OwnerWS<AT, ResultOk<SAR<AT>>, REL> & {
    readonly state: StateArray<AT, REL>;
    readonly read_only: StateArrayROS<AT, REL>;
    readonly read_write: StateArrayROSW<AT, REL>;
  };

export type StateArraySyncRES<
  AT,
  REL extends Option<RELATED> = Option<{}>,
> = StateRES<SAR<AT>, REL, SAW<AT>> &
  Owner<AT, ResultOk<SAR<AT>>, REL> & {
    set_err(error: string): void;
    readonly state: StateArray<AT, REL>;
    readonly read_only: StateArrayRES<AT, REL>;
    readonly read_write?: StateArrayRESW<AT, REL>;
  };

export type StateArraySyncRESWS<
  AT,
  REL extends Option<RELATED> = Option<{}>,
> = StateRESW<SAR<AT>, SAW<AT>, REL> &
  OwnerWS<AT, ResultOk<SAR<AT>>, REL> & {
    set_err(error: string): void;
    readonly state: StateArray<AT, REL>;
    readonly read_only: StateArrayRES<AT, REL>;
    readonly read_write: StateArrayRESW<AT, REL>;
  };

//##################################################################################################################################################
//      _    _ ______ _      _____  ______ _____   _____
//     | |  | |  ____| |    |  __ \|  ____|  __ \ / ____|
//     | |__| | |__  | |    | |__) | |__  | |__) | (___
//     |  __  |  __| | |    |  ___/|  __| |  _  / \___ \
//     | |  | | |____| |____| |    | |____| | \ \ ____) |
//     |_|  |_|______|______|_|    |______|_|  \_\_____/

export function apply_read<AT>(array: AT[], read: StateArrayRead<AT>): AT[];
export function apply_read<AT, TAT = AT>(
  array: AT[],
  read: StateArrayRead<TAT>,
  transform: (value: TAT, index: number, array: readonly TAT[]) => AT,
): AT[];
export function apply_read<AT, TAT = AT>(
  array: AT[],
  read: StateArrayRead<TAT & AT>,
  transform?: (value: TAT, index: number, array: readonly TAT[]) => AT,
): AT[] {
  const a = array;
  const t = transform;
  const { type: ty, index: ix, items: it } = read;
  if (ty === "fresh") a.splice(ix, a.length, ...(t ? it.map(t) : it));
  else if (ty === "added") a.splice(ix, 0, ...(t ? it.map(t) : it));
  else if (ty === "removed") a.splice(ix, it.length);
  else if (ty === "changed")
    for (let i = 0; i < it.length; i++) a[ix + i] = t ? t(it[i], i, it) : it[i];
  return a;
}

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

class RXS<
  AT,
  RRT extends Result<SAR<AT>, string>,
  REL extends Option<RELATED> = OptionNone,
>
  extends StateBase<SAR<AT>, SAW<AT>, REL, RRT>
  implements Owner<AT, RRT, REL>
{
  get [STATE_ARRAY_KEY](): true {
    return true;
  }

  constructor(
    init: Result<AT[], string>,
    helper?: HELPER<SAW<AT>, REL>,
    setter?: ArraySetter<AT, RRT, REL> | true,
  ) {
    super();
    if (setter === true) this.#setter = (val) => ok(this.apply_write(ok(val)));
    else this.#setter = setter;
    if (helper) this.#helper = helper;
    this.set(init);
  }

  #error?: string;
  #array: AT[] = [];
  #helper?: HELPER<SAW<AT>, REL>;
  #setter?: ArraySetter<AT, RRT, REL>;
  #length?: StateSyncROS<number>;

  #mr(type: StateArrayReadType, index: number, items: AT[]): SAR<AT> {
    return { array: this.#array, type, index, items };
  }

  set(value: Result<readonly AT[], string>) {
    this.#array = value.ok ? [...value.value] : [];
    this.#error = value.ok ? undefined : value.error;
    this.update_subs(ok(this.#mr("fresh", 0, this.#array)) as RRT);
  }
  set_ok(value: readonly AT[]): void {
    this.set(ok(value));
  }
  set_err(error: string): void {
    this.set(err(error));
  }

  set setter(setter: ArraySetter<AT, RRT, REL> | undefined) {
    this.#setter = setter;
  }
  get setter(): ArraySetter<AT, RRT, REL> | undefined {
    return this.#setter;
  }
  get state(): StateArray<AT, REL> {
    return this as StateArray<AT, REL>;
  }
  get read_only(): StateArrayROS<AT, REL> {
    return this as StateArrayROS<AT, REL>;
  }
  get read_write(): StateArrayROSW<AT, REL> | undefined {
    return this.#setter ? (this as StateArrayROSW<AT, REL>) : undefined;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): true {
    return true;
  }
  async then<T = RRT>(func: (value: RRT) => T | PromiseLike<T>): Promise<T> {
    return func(this.get());
  }
  get(): RRT {
    if (this.#error) return err(this.#error) as RRT;
    return ok(this.#mr("fresh", 0, this.#array)) as RRT;
  }
  ok(): SAR<AT> {
    return this.#mr("fresh", 0, this.#array);
  }
  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }

  //#Writer Context
  get writable(): boolean {
    return this.#setter !== undefined;
  }
  get wsync(): boolean {
    return this.writable;
  }
  async write(value: SAW<AT>): Promise<Result<void, string>> {
    return this.write_sync(value);
  }
  write_sync(value: SAW<AT>): Result<void, string> {
    if (this.#setter)
      return this.#setter(value, this as OwnerWS<AT, RRT, REL>, this.get());
    return err("not writable");
  }
  limit(value: SAW<AT>): Promise<Result<SAW<AT>, string>> {
    return this.#helper?.limit
      ? this.#helper.limit(value)
      : Promise.resolve(ok(value));
  }
  check(value: SAW<AT>): Promise<Result<SAW<AT>, string>> {
    return this.#helper?.check
      ? this.#helper.check(value)
      : Promise.resolve(ok(value));
  }

  //Array/Owner Context
  get array(): readonly AT[] {
    return this.#array;
  }

  get length(): number {
    return this.#array.length;
  }

  get length_state(): StateROS<number> {
    return (this.#length ??= STATE_SYNC.ros.ok(this.length));
  }

  at(index: number): AT | undefined {
    return this.#array.at(index);
  }

  set_index(index: number, value: AT): void {
    const l = this.#array.length;
    this.#array[index] = value;
    this.update_subs(ok(this.#mr("changed", index, [value])) as RRT);
    if (this.#array.length !== l && this.#length)
      this.#length.set_ok(this.#array.length);
  }

  push(...items: AT[]): number {
    const index = this.#array.length;
    const new_len = this.#array.push(...items);
    this.update_subs(ok(this.#mr("added", index, items)) as RRT);
    if (this.#length) this.#length.set_ok(new_len);
    return new_len;
  }

  pop(): AT | undefined {
    const l = this.#array.length;
    const p = this.#array.pop();
    if (this.#array.length < l) {
      this.update_subs(
        ok(this.#mr("removed", this.#array.length, [p as AT])) as RRT,
      );
      if (this.#length) this.#length.set_ok(this.#array.length);
    }
    return p;
  }

  shift(): AT | undefined {
    const l = this.#array.length;
    const s = this.#array.shift();
    if (this.#array.length < l) {
      this.update_subs(ok(this.#mr("removed", 0, [s as AT])) as RRT);
      if (this.#length) this.#length.set_ok(this.#array.length);
    }
    return s;
  }

  unshift(...items: AT[]): number {
    const new_len = this.#array.unshift(...items);
    this.update_subs(ok(this.#mr("added", 0, items)) as RRT);
    if (this.#length) this.#length.set_ok(new_len);
    return new_len;
  }

  splice(start: number, delete_count?: number, ...items: AT[]): AT[] {
    const r = this.#array.splice(start, delete_count!, ...items);
    if (r.length > 0)
      this.update_subs(ok(this.#mr("removed", start, r)) as RRT);
    if (items.length > 0)
      this.update_subs(ok(this.#mr("added", start, items)) as RRT);
    if (this.#length) this.#length.set_ok(this.#array.length);
    return r;
  }

  delete(val: AT) {
    for (let i = 0; i < this.#array.length; i++)
      if ((this.#array[i] = val)) {
        this.update_subs(ok(this.#mr("removed", i, [val])) as RRT);
        i--;
      }
    if (this.#length) this.#length.set_ok(this.#array.length);
  }

  ///Helps apply the changes from one state array to another
  apply_read<B>(
    result: ResultOk<SAR<B>>,
    transform: (val: readonly B[], type: StateArrayReadType) => AT[],
  ) {
    const { index, items: its, type } = result.value;
    const items = transform(its, type);
    if (type === "fresh") return this.set(ok(items));
    else if (type === "added") this.#array.splice(index, 0, ...items);
    else if (type === "removed") this.#array.splice(index, items.length);
    else if (type === "changed")
      for (let i = 0; i < its.length; i++) this.#array[index + i] = items[i];
    this.update_subs(ok(this.#mr(type, index, items)) as RRT);
  }

  apply_write(result: Result<SAW<AT>, string>) {
    if (!result.ok) return;
    const type = result.value.type;
    if (type === "write") this.set_ok(result.value.items);
    else if (type === "pop") this.pop();
    else if (type === "shift") this.shift();
    else if (type === "push") this.push(...result.value.items);
    else if (type === "unshift") this.unshift(...result.value.items);
    else if (type === "delete") this.delete(result.value.item);
    else if (type === "splice")
      this.splice(
        result.value.index,
        result.value.delete_count,
        ...(result.value.items ? result.value.items : []),
      );
    else if (type === "change")
      this.set_index(result.value.index, result.value.item);
  }

  apply_write_transform<B>(
    result: Result<SAW<B>, string>,
    transform: (val: B) => AT,
  ) {
    if (!result.ok) return;
    const type = result.value.type;
    if (type === "write")
      this.set_ok(result.value.items.map((item) => transform(item)));
    else if (type === "pop") this.pop();
    else if (type === "shift") this.shift();
    else if (type === "push")
      this.push(...result.value.items.map((item) => transform(item)));
    else if (type === "unshift")
      this.unshift(...result.value.items.map((item) => transform(item)));
    else if (type === "delete") this.delete(transform(result.value.item));
    else if (type === "splice")
      this.splice(
        result.value.index,
        result.value.delete_count,
        ...(result.value.items
          ? result.value.items.map((item) => transform(item))
          : []),
      );
    else if (type === "change")
      this.set_index(result.value.index, transform(result.value.item));
  }
}

//##################################################################################################################################################
//       _____ ______ _   _ ______ _____         _______ ____  _____   _____
//      / ____|  ____| \ | |  ____|  __ \     /\|__   __/ __ \|  __ \ / ____|
//     | |  __| |__  |  \| | |__  | |__) |   /  \  | | | |  | | |__) | (___
//     | | |_ |  __| | . ` |  __| |  _  /   / /\ \ | | | |  | |  _  / \___ \
//     | |__| | |____| |\  | |____| | \ \  / ____ \| | | |__| | | \ \ ____) |
//      \_____|______|_| \_|______|_|  \_\/_/    \_\_|  \____/|_|  \_\_____/
const ROS = {
  /**Creates a state representing an array
   * @param init initial array, leave empty for empty array
   * @param helper functions to make related*/
  ok<AT, REL extends Option<RELATED> = Option<{}>>(
    init: AT[] = [],
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, ResultOk<SAR<AT>>, REL>(
      ok(init),
      helper,
    ) as StateArraySyncROS<AT, REL>;
  },
};
const ROS_WS = {
  /**Creates a state representing an array
   * @param init initial array, leave empty for empty array
   * @param setter function called when state value is set via setter, set true let write set it's value
   * @param helper functions to check and limit*/
  ok<AT, REL extends Option<RELATED> = Option<{}>>(
    init: AT[] = [],
    setter:
      | StateSetREXWS<SAR<AT>, OwnerWS<AT, ResultOk<SAR<AT>>, REL>, SAW<AT>>
      | true,
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, ResultOk<SAR<AT>>, REL>(
      ok(init),
      helper,
      setter,
    ) as StateArraySyncROSWS<AT, REL>;
  },
};
const RES = {
  /**Creates a state representing an array
   * @param init initial array, leave empty for empty array
   * @param helper functions to make related*/
  ok<AT, REL extends Option<RELATED> = Option<{}>>(
    init: AT[] = [],
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, Result<SAR<AT>, string>, REL>(
      ok(init),
      helper,
    ) as StateArraySyncRES<AT, REL>;
  },
  /**Creates a state representing an array
   * @param init initial error
   * @param helper functions to make related*/
  err<AT, REL extends Option<RELATED> = Option<{}>>(
    error: string,
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, Result<SAR<AT>, string>, REL>(
      err(error),
      helper,
    ) as StateArraySyncRES<AT, REL>;
  },
};
const RES_WS = {
  /**Creates a state representing an array
   * @param init initial array, leave empty for empty array
   * @param setter function called when state value is set via setter, set true let write set it's value
   * @param helper functions to check and limit*/
  ok<AT, REL extends Option<RELATED> = Option<{}>>(
    init: AT[] = [],
    setter:
      | StateSetREXWS<
          SAR<AT>,
          OwnerWS<AT, Result<SAR<AT>, string>, REL>,
          SAW<AT>
        >
      | true,
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, Result<SAR<AT>, string>, REL>(
      ok(init),
      helper,
      setter,
    ) as StateArraySyncRESWS<AT, REL>;
  },
  /**Creates a state representing an array
   * @param err initial error
   * @param setter function called when state value is set via setter, set true let write set it's value
   * @param helper functions to check and limit*/
  err<AT, REL extends Option<RELATED> = Option<{}>>(
    error: string,
    setter:
      | StateSetREXWS<
          SAR<AT>,
          OwnerWS<AT, Result<SAR<AT>, string>, REL>,
          SAW<AT>
        >
      | true,
    helper?: HELPER<SAW<AT>, REL>,
  ) {
    return new RXS<AT, Result<SAR<AT>, string>, REL>(
      err(error),
      helper,
      setter,
    ) as StateArraySyncRESWS<AT, REL>;
  },
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/
/**States representing arrays */
export const STATE_ARRAY = {
  /**The state key is a symbol used to identify state array objects
   * To implement a custom state, set this key to true on the object */
  STATE_ARRAY_KEY,
  /** Applies a read from a state array to another array
   * @template AT - Types allowed in both arrays.
   * @template TAT - Optional type if state array type is different from array
   * @param array Array to modify in place
   * @param read Read struct from state array
   * @param transform optional tranform function for when state array is not same type of array*/
  apply_read,
  ros: ROS,
  ros_ws: ROS_WS,
  res: RES,
  res_ws: RES_WS,
  /**Returns true if the given object promises to be a state array */
  is(s: unknown): s is StateArray<any, any> {
    //@ts-expect-error Will not crash
    return Boolean(s) && s[STATE_ARRAY_KEY] === true;
  },
  //# Array Write Helpers
  write<T>(items: T[]): StateArrayWrite<T> {
    return { type: "write", items };
  },
  index<T>(index: number, value: T): StateArrayWrite<T> {
    return { type: "change", index, item: value };
  },
  push<T>(...items: T[]): StateArrayWrite<T> {
    return { type: "push", items };
  },
  pop<T>(): StateArrayWrite<T> {
    return { type: "pop" };
  },
  shift<T>(): StateArrayWrite<T> {
    return { type: "shift" };
  },
  unshift<T>(...items: T[]): StateArrayWrite<T> {
    return { type: "unshift", items };
  },
  splice<T>(
    start: number,
    delete_count?: number,
    ...items: T[]
  ): StateArrayWrite<T> {
    return {
      type: "splice",
      index: start,
      delete_count: delete_count ?? 0,
      items,
    };
  },
  pluck<T>(index: number): StateArrayWrite<T> {
    return { type: "splice", index, delete_count: 1 };
  },
  insert<T>(index: number, ...items: T[]): StateArrayWrite<T> {
    return { type: "splice", index, delete_count: 0, items };
  },
};
