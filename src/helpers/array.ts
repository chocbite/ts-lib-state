import {
  err,
  ok,
  OptionSome,
  ResultOk,
  ResultInferOk as RIO,
  some,
} from "@chocbite/ts-lib-result";
import { ros } from "../normal";
import { StateResult as SR, StateROS } from "../types";
import {
  StateInitResult as SIR,
  StateHelperBase,
  StateHelperBaseOptions,
  StateInit,
  StateRelatedBase,
} from "./helpers";

export const STATE_ARRAY_READ_KEY = Symbol("state_array_read_key");

type StateArrayReadTypes<TYPE> = {
  [STATE_ARRAY_READ_KEY]?:
    | {
        type: "added";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "removed";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "changed";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "fresh";
        items: readonly TYPE[];
      };
};
export type StateArrayRead<TYPE> = readonly TYPE[] & StateArrayReadTypes<TYPE>;

export const STATE_ARRAY_WRITE_KEY = Symbol("state_array_write_key");

export type StateArrayWrite<TYPE> = TYPE[] & {
  [STATE_ARRAY_WRITE_KEY]?:
    | {
        type: "fresh";
      }
    | {
        type: "change";
        index: number;
        item: TYPE;
      }
    | {
        type: "push";
        items: TYPE[];
      }
    | {
        type: "unshift";
        items: TYPE[];
      }
    | { type: "pop" }
    | { type: "shift" }
    | {
        type: "delete";
        item: TYPE;
      }
    | {
        type: "splice";
        index: number;
        delete_count: number;
        items?: TYPE[];
      };
};

export interface StateArrayMethods<T> {
  get array(): readonly T[];
  get length(): number;
  at(index: number): T | undefined;
  set_index(index: number, value: T): void;
  push(...items: T[]): number;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): number;
  splice(start: number, delete_count?: number, ...items: T[]): T[];
  delete(val: T): void;
}

const write = {
  fresh<T>(array: T[]): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[STATE_ARRAY_WRITE_KEY] = { type: "fresh" };
    return array;
  },
  index<T>(index: number, value: T): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "change", index, item: value };
    return array;
  },
  push<T>(...items: T[]): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "push", items };
    return array;
  },
  pop<T>(): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "pop" };
    return array;
  },
  unshift<T>(...items: T[]): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "unshift", items };
    return array;
  },
  shift<T>(): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = { type: "shift" };
    return array;
  },
  splice<T>(
    start: number,
    delete_count?: number,
    ...items: T[]
  ): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[STATE_ARRAY_WRITE_KEY] = {
      type: "splice",
      index: start,
      delete_count: delete_count ?? 0,
      items,
    };
    return array;
  },
};

export class ArrayOwner<T> implements StateArrayMethods<T> {
  #getter: () => SR<T[]>;
  #setter: (v: ResultOk<T[] & StateArrayReadTypes<T>>) => void;
  constructor(
    getter: () => SR<T[]>,
    setter: (v: ResultOk<T[] & StateArrayReadTypes<T>>) => void,
  ) {
    this.#getter = getter;
    this.#setter = setter;
  }
  get array(): readonly T[] {
    return this.#getter().unwrap_or<T[]>([]);
  }
  get length(): number {
    return this.#getter().unwrap_or<T[]>([]).length;
  }
  at(index: number): T | undefined {
    return this.#getter().unwrap_or<T[]>([])[index];
  }
  set_index(index: number, value: T): void {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    arr[index] = value;
    arr[STATE_ARRAY_READ_KEY] = { type: "changed", index, items: [value] };
    this.#setter(ok(arr));
  }
  push(...items: T[]): number {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const index = arr.length;
    const new_len = arr.push(...items);
    arr[STATE_ARRAY_READ_KEY] = { type: "added", index, items };
    this.#setter(ok(arr));
    return new_len;
  }
  pop(): T | undefined {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const l = arr.length;
    const p = arr.pop();
    if (arr.length < l) {
      arr[STATE_ARRAY_READ_KEY] = {
        type: "removed",
        index: arr.length,
        items: [p!],
      };
      this.#setter(ok(arr));
    }
    return p;
  }
  shift(): T | undefined {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const l = arr.length;
    const s = arr.shift();
    if (arr.length < l) {
      arr[STATE_ARRAY_READ_KEY] = {
        type: "removed",
        index: 0,
        items: [s!],
      };
      this.#setter(ok(arr));
    }
    return s;
  }
  unshift(...items: T[]): number {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const new_len = arr.unshift(...items);
    arr[STATE_ARRAY_READ_KEY] = { type: "added", index: 0, items };
    this.#setter(ok(arr));
    return new_len;
  }
  splice(start: number, delete_count?: number, ...items: T[]): T[] {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const r = arr.splice(start, delete_count!, ...items);
    if (r.length > 0) {
      arr[STATE_ARRAY_READ_KEY] = { type: "removed", index: start, items: r };
      this.#setter(ok(arr));
    }
    if (items.length > 0) {
      arr[STATE_ARRAY_READ_KEY] = { type: "added", index: start, items };
      this.#setter(ok(arr));
    }
    return r;
  }
  delete(val: T): void {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    for (let i = 0; i < arr.length; i++)
      if ((arr[i] = val)) {
        arr[STATE_ARRAY_READ_KEY] = {
          type: "removed",
          index: i,
          items: [val],
        };
        this.#setter(ok(arr));
        i--;
      }
  }
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

export class StateArrayHelper<RT extends any[]>
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

  constructor(options: StateArrayHelperOptions) {
    super(options);
  }

  protected set(value: SR<RT>): void {
    if (value.ok) this.length.set_ok(value.value.length);
    else this.length.set_ok(0);
  }

  async limit(value: RT): Promise<SR<RT>> {
    return ok(value);
  }

  async check(value: RT): Promise<SR<RT>> {
    if (this.writable !== undefined && !this.writable)
      return err("not writable");
    return ok(value);
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
  is_helper(h: any): h is StateArrayHelper<any> {
    return Boolean(
      h && (h as { [STATE_ARRAY_HELPER_KEY]: boolean })[STATE_ARRAY_HELPER_KEY],
    );
  },
  /**Array helper*/
  help<I extends StateInit<any[]>, RRT extends SR<any> = SIR<I>>(
    init: I,
    options: StateArrayHelperOptions,
  ): [I, StateArrayHelper<RIO<RRT>>] {
    return [init, new StateArrayHelper<RIO<RRT>>(options)];
  },
  /**Unique key to check if an array contains an array read object */
  read_key: STATE_ARRAY_READ_KEY,
  /**Returns true if object is a array read object */
  is_read(a: any): a is StateArrayRead<any> {
    return Boolean(
      a && (a as { [STATE_ARRAY_READ_KEY]: boolean })[STATE_ARRAY_READ_KEY],
    );
  },
  /**Returns the state array granular read object for an array, or a fake one if the array is not a state array read object */
  read<RT>(arr: readonly RT[]): StateArrayReadTypes<RT> {
    return (
      ((arr as StateArrayRead<RT>)[
        STATE_ARRAY_READ_KEY
      ] as StateArrayReadTypes<RT>) ?? {
        type: "fresh",
        items: arr,
      }
    );
  },
  write,
  write_key: STATE_ARRAY_WRITE_KEY,
  write_owner<T>(owner: ArrayOwner<T>, write: StateArrayWrite<T>): void {},
};
