import { sync_resolve } from "@chocbite/ts-lib-common";
import {
  err,
  ok,
  OptionSome,
  ResultInferOk as RIO,
  some,
} from "@chocbite/ts-lib-result";
import { ros } from "../local";
import { StateResult as SR, StateHelper, StateROS } from "../types";
import {
  StateInitResult as SIR,
  StateHelperBase,
  StateHelperBaseOptions,
  StateInit,
  StateRelatedBase,
} from "./helpers";

//##################################################################################################################################################
//      _____  ______          _____
//     |  __ \|  ____|   /\   |  __ \
//     | |__) | |__     /  \  | |  | |
//     |  _  /|  __|   / /\ \ | |  | |
//     | | \ \| |____ / ____ \| |__| |
//     |_|  \_\______/_/    \_\_____/
export const STATE_ARRAY_READ_KEY = Symbol("state_array_read_key");

export type StateArrayReadTypes<RT> =
  | {
      type: "added";
      index: number;
      items: readonly RT[];
    }
  | {
      type: "removed";
      index: number;
      items: readonly RT[];
    }
  | {
      type: "changed";
      index: number;
      items: readonly RT[];
    }
  | {
      type: "fresh";
      items: readonly RT[];
    };

export type StateArrayRead<RT> = readonly RT[] & {
  [STATE_ARRAY_READ_KEY]?: StateArrayReadTypes<RT>[];
};

/**Returns the state array granular read object for an array, or a fake one if the array is not a state array read object */
function read<RT>(arr: readonly RT[]): StateArrayReadTypes<RT>[] {
  return (
    (arr as StateArrayRead<RT>)[STATE_ARRAY_READ_KEY] ?? [
      { type: "fresh", items: arr },
    ]
  );
}

/**Applies the state array read object to an array, returning the modified array or a new array
 * If a transform function is provided, elements will be transformed before being added to the array*/
function read_apply<T, U>(
  read: StateArrayRead<T>,
  array: U[],
  transform: (item: T) => U,
): U[];
// 2. Overload for when transform is NOT provided
function read_apply<T>(
  read: StateArrayRead<T>,
  array: T[],
  transform?: undefined,
): T[];
function read_apply<T, U>(
  read: StateArrayRead<T>,
  array: U[] | T[],
  transform?: (item: T) => U,
): U[] | T[] {
  if (transform) {
    if (read[STATE_ARRAY_READ_KEY]) {
      for (const r of read[STATE_ARRAY_READ_KEY]) {
        if (r.type === "added")
          array.splice(r.index, 0, ...r.items.map(transform));
        else if (r.type === "removed") array.splice(r.index, r.items.length);
        else if (r.type === "changed")
          for (let i = 0; i < r.items.length; i++)
            array[r.index + i] = transform(r.items[i]);
        else if (r.type === "fresh") return read.map(transform);
      }
      return array;
    } else {
      return read.map(transform);
    }
  } else {
    if (read[STATE_ARRAY_READ_KEY]) {
      for (const r of read[STATE_ARRAY_READ_KEY]) {
        if (r.type === "added") array.splice(r.index, 0, ...r.items);
        else if (r.type === "removed") array.splice(r.index, r.items.length);
        else if (r.type === "changed")
          for (let i = 0; i < r.items.length; i++)
            array[r.index + i] = r.items[i];
        else if (r.type === "fresh") return read as T[];
      }
      return array;
    } else {
      return read as T[];
    }
  }
}

/**Calls a setter function with a state array read object*/
function read_set<T>(
  read: [T[], StateArrayReadTypes<T>[] | undefined],
  setter: (value: StateArrayRead<T>) => void,
) {
  const [array, read_types] = read as [
    StateArrayRead<T>,
    StateArrayReadTypes<T>[] | undefined,
  ];
  if (read_types) array[STATE_ARRAY_READ_KEY] = read_types;
  setter(array);
  if (array[STATE_ARRAY_READ_KEY]) delete array[STATE_ARRAY_READ_KEY];
}

//##################################################################################################################################################
//     __          _______  _____ _______ ______
//     \ \        / /  __ \|_   _|__   __|  ____|
//      \ \  /\  / /| |__) | | |    | |  | |__
//       \ \/  \/ / |  _  /  | |    | |  |  __|
//        \  /\  /  | | \ \ _| |_   | |  | |____
//         \/  \/   |_|  \_\_____|  |_|  |______|

export const STATE_ARRAY_WRITE_KEY = Symbol("state_array_write_key");

export type StateArrayWriteTypes<WT> =
  | { type: "fresh"; items: WT[] }
  | { type: "push"; items: WT[] }
  | { type: "unshift"; items: WT[] }
  | { type: "pop" }
  | { type: "shift" }
  | { type: "delete"; delete: WT }
  | { type: "change"; index: number; items: WT[] }
  | { type: "splice"; index: number; delete_count: number; items: WT[] };

export type StateArrayWrite<WT> =
  | WT[]
  | {
      [STATE_ARRAY_WRITE_KEY]?: StateArrayWriteTypes<WT>;
    };

const write = {
  fresh<T>(items: T[]): StateArrayWrite<T> {
    (items as any)[STATE_ARRAY_WRITE_KEY] = {
      type: "fresh",
      items,
    };
    return items;
  },
  push<T>(...items: T[]): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "push", items };
    return array;
  },
  unshift<T>(...items: T[]): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "unshift", items };
    return array;
  },
  pop<T>(): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "pop" };
    return array;
  },
  shift<T>(): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "shift" };
    return array;
  },
  delete<T>(val: T): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "delete", delete: val };
    return array;
  },
  change<T>(index: number, ...items: T[]): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "change", index, items };
    return array;
  },
  splice<T>(
    start: number,
    delete_count: number = 0,
    ...items: T[]
  ): StateArrayWrite<T> {
    const array: any = [];
    array[STATE_ARRAY_WRITE_KEY] = {
      type: "splice",
      index: start,
      delete_count: delete_count,
      items,
    };
    return array;
  },
};

/**Modifies an array based on a StateArrayWrite instruction and returns the modified array and state array read types*/
function write_apply<T>(
  write: StateArrayWrite<T>,
  array: T[] = [],
): [T[], StateArrayReadTypes<T>[] | undefined] {
  const wk = (write as any)[STATE_ARRAY_WRITE_KEY] as
    | StateArrayWriteTypes<T>
    | undefined;
  if (wk) {
    const w = wk;
    if (w.type === "fresh")
      return [write as T[], [{ type: "fresh", items: write as T[] }]];
    else if (w.type === "push") {
      const index = array.length;
      array.push(...w.items);
      return [array, [{ type: "added", index, items: w.items }]];
    } else if (w.type === "unshift") {
      array.unshift(...w.items);
      return [array, [{ type: "added", index: 0, items: w.items }]];
    } else if (w.type === "pop") {
      const items = [array.pop()!];
      if (items[0])
        return [array, [{ type: "removed", index: array.length, items }]];
      else return [[], undefined];
    } else if (w.type === "shift") {
      const items = [array.shift()!];
      if (items[0]) return [array, [{ type: "removed", index: 0, items }]];
      else return [[], undefined];
    } else if (w.type === "delete") {
      const operations = [] as StateArrayReadTypes<T>[];
      for (let i = 0; i < array.length; i++) {
        if (array[i] === w.delete) {
          array.splice(i, 1);
          operations.push({ type: "removed", index: i, items: [w.delete] });
          i--;
        }
      }
      return [array, operations];
    } else if (w.type === "change") {
      for (let i = 0; i < w.items.length; i++) array[w.index + i] = w.items[i];
      return [array, [{ type: "changed", index: w.index, items: w.items }]];
    } else if (w.type === "splice") {
      const removed = array.splice(w.index, w.delete_count, ...w.items);
      const operations = [] as StateArrayReadTypes<T>[];
      if (removed.length > 0)
        operations.push({ type: "removed", index: w.index, items: removed });
      if (w.items.length > 0)
        operations.push({ type: "added", index: w.index, items: w.items });
      return [array, operations];
    } else return [array, undefined];
  } else return [write as T[], undefined];
}

//##################################################################################################################################################
//      _    _ ______ _      _____  ______ _____
//     | |  | |  ____| |    |  __ \|  ____|  __ \
//     | |__| | |__  | |    | |__) | |__  | |__) |
//     |  __  |  __| | |    |  ___/|  __| |  _  /
//     | |  | | |____| |____| |    | |____| | \ \
//     |_|  |_|______|______|_|    |______|_|  \_\
export const STATE_ARRAY_RELATED_KEY = Symbol("state_array_related");
export const STATE_ARRAY_HELPER_KEY = Symbol("state_array_helper");

export interface StateArrayRelated extends StateRelatedBase {
  readonly [STATE_ARRAY_RELATED_KEY]: true;
  length: StateROS<number>;
}

export interface StateArrayHelperOptions extends StateHelperBaseOptions {}

export interface StateArrayHelper<RT extends any[]> extends StateHelper<
  SR<RT>,
  RT,
  OptionSome<StateArrayRelated>
> {}

export class StateArrayHelperBase<RT extends any[]>
  extends StateHelperBase<SR<RT>, RT, OptionSome<StateArrayRelated>>
  implements StateArrayRelated
{
  get [STATE_ARRAY_RELATED_KEY](): true {
    return true;
  }
  get [STATE_ARRAY_HELPER_KEY](): true {
    return true;
  }

  readonly length = ros(ok(0));

  constructor(options?: StateArrayHelperOptions) {
    super(options);
  }

  on_change(value: SR<RT>): void {
    if (value.ok) this.length.set_ok(value.value.length);
    else this.length.set_ok(0);
  }

  limit(value: RT): PromiseLike<SR<RT>> {
    return sync_resolve(ok(value));
  }

  check(value: RT): PromiseLike<SR<RT>> {
    if (this.writable !== undefined && !this.writable)
      return sync_resolve(err("not writable"));
    return sync_resolve(ok(value));
  }

  related(): OptionSome<StateArrayRelated> {
    return some(this);
  }
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

export const ARRAY = {
  /**Unique key to check if object is a array related */
  RELATED_KEY: STATE_ARRAY_RELATED_KEY,
  /**Returns true if object is a array related */
  is_related(r: any): r is StateArrayRelated {
    return Boolean(
      r &&
      (r as { [STATE_ARRAY_RELATED_KEY]: boolean })[STATE_ARRAY_RELATED_KEY],
    );
  },
  /**Unique key to check if object is a array helper */
  HELPER_KEY: STATE_ARRAY_HELPER_KEY,
  /**Returns true if object is a array helper */
  is_helper(h: any): h is StateArrayHelperBase<any> {
    return Boolean(
      h && (h as { [STATE_ARRAY_HELPER_KEY]: boolean })[STATE_ARRAY_HELPER_KEY],
    );
  },
  /**Array helper*/
  help<I extends StateInit<any[]>, RRT extends SR<any> = SIR<I>>(
    init: I,
    options?: StateArrayHelperOptions,
  ): [I, StateArrayHelper<RIO<RRT>>] {
    return [init, new StateArrayHelperBase<RIO<RRT>>(options)];
  },
  //### Read
  /**Unique key to check if an array contains an array read object */
  read_key: STATE_ARRAY_READ_KEY,
  /**Returns true if object is a array read object */
  is_read(a: any): a is StateArrayRead<any> {
    return Boolean(
      a && (a as { [STATE_ARRAY_READ_KEY]: boolean })[STATE_ARRAY_READ_KEY],
    );
  },
  read,
  read_apply,
  read_set,
  //### Read
  write_key: STATE_ARRAY_WRITE_KEY,
  is_write(a: any): a is StateArrayWrite<any> {
    return Boolean(
      a && (a as { [STATE_ARRAY_WRITE_KEY]: boolean })[STATE_ARRAY_WRITE_KEY],
    );
  },
  write,
  write_apply,
};
