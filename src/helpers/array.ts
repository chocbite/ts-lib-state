import {
  err,
  ok,
  OptionSome,
  Result,
  ResultInferOk,
  ResultOk,
  some,
} from "@chocbite/ts-lib-result";
import { ros } from "../normal";
import { StateROS } from "../types";
import {
  StateHelperBase,
  StateHelperBaseOptions,
  StateInit,
  StateInitResult,
  StateRelatedBase,
} from "./helpers";

export const ARRAY_READ_KEY = Symbol("state_array_read_key");

type StateArrayReadTypes<TYPE> = {
  [ARRAY_READ_KEY]?:
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
      };
};
export type StateArrayRead<TYPE> = readonly TYPE[] & StateArrayReadTypes<TYPE>;

export const ARRAY_WRITE_KEY = Symbol("state_array_write_key");

export type StateArrayWrite<TYPE> = TYPE[] & {
  [ARRAY_WRITE_KEY]?:
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
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = { type: "fresh" };
    return array;
  },
  index<T>(index: number, value: T): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = { type: "change", index, item: value };
    return array;
  },
  push<T>(...items: T[]): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = { type: "push", items };
    return array;
  },
  pop<T>(): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = { type: "pop" };
    return array;
  },
  unshift<T>(...items: T[]): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = { type: "unshift", items };
    return array;
  },
  shift<T>(): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = { type: "shift" };
    return array;
  },
  splice<T>(
    start: number,
    delete_count?: number,
    ...items: T[]
  ): StateArrayWrite<T> {
    const array: StateArrayWrite<T> = [];
    array[ARRAY_WRITE_KEY] = {
      type: "splice",
      index: start,
      delete_count: delete_count ?? 0,
      items,
    };
    return array;
  },
};

export class ArrayOwner<T> implements StateArrayMethods<T> {
  #getter: () => Result<T[], string>;
  #setter: (v: ResultOk<T[] & StateArrayReadTypes<T>>) => void;
  constructor(
    getter: () => Result<T[], string>,
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
    arr[ARRAY_READ_KEY] = { type: "changed", index, items: [value] };
    this.#setter(ok(arr));
  }
  push(...items: T[]): number {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const index = arr.length;
    const new_len = arr.push(...items);
    arr[ARRAY_READ_KEY] = { type: "added", index, items };
    this.#setter(ok(arr));
    return new_len;
  }
  pop(): T | undefined {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const l = arr.length;
    const p = arr.pop();
    if (arr.length < l) {
      arr[ARRAY_READ_KEY] = { type: "removed", index: arr.length, items: [p!] };
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
      arr[ARRAY_READ_KEY] = {
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
    arr[ARRAY_READ_KEY] = { type: "added", index: 0, items };
    this.#setter(ok(arr));
    return new_len;
  }
  splice(start: number, delete_count?: number, ...items: T[]): T[] {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    const r = arr.splice(start, delete_count!, ...items);
    if (r.length > 0) {
      arr[ARRAY_READ_KEY] = { type: "removed", index: start, items: r };
      this.#setter(ok(arr));
    }
    if (items.length > 0) {
      arr[ARRAY_READ_KEY] = { type: "added", index: start, items };
      this.#setter(ok(arr));
    }
    return r;
  }
  delete(val: T): void {
    const arr = this.#getter().unwrap_or<T[]>([]) as T[] &
      StateArrayReadTypes<T>;
    for (let i = 0; i < arr.length; i++)
      if ((arr[i] = val)) {
        arr[ARRAY_READ_KEY] = {
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

export interface StateArrayRelated extends StateRelatedBase {
  length: StateROS<number>;
}

export interface StateArrayHelperOptions extends StateHelperBaseOptions {}

export class StateArrayHelper<RT extends any[]>
  extends StateHelperBase<Result<RT, string>, RT, OptionSome<StateArrayRelated>>
  implements StateArrayRelated
{
  readonly length = ros(ok(0));

  constructor(options: StateArrayHelperOptions) {
    super(options);
  }

  protected set(value: Result<RT, string>): void {
    if (value.ok) this.length.set_ok(value.value.length);
    else this.length.set_ok(0);
  }

  async limit(value: RT): Promise<Result<RT, string>> {
    return ok(value);
  }

  async check(value: RT): Promise<Result<RT, string>> {
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
  read<RT>(arr: readonly RT[]): StateArrayRead<RT> {
    (arr as StateArrayRead<RT>)[ARRAY_READ_KEY] ??= { type: "fresh" };
    return arr as StateArrayRead<RT>;
  },
  write,
  read_key: ARRAY_READ_KEY,
  write_key: ARRAY_WRITE_KEY,
  write_owner<T>(owner: ArrayOwner<T>, write: StateArrayWrite<T>): void {},
  /**Array helper*/
  help<
    RRRT extends StateInit<any[]>,
    RRT extends Result<any, string> = StateInitResult<RRRT>,
  >(
    init: RRRT,
    options: StateArrayHelperOptions,
  ): [RRRT, StateArrayHelper<ResultInferOk<RRT>>] {
    return [init, new StateArrayHelper<ResultInferOk<RRT>>(options)];
  },
};
