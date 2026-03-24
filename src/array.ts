import { ok, Result, ResultOk } from "@chocbite/ts-lib-result";

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
  fresh<T>(array: T[] = []): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = { type: "fresh" };
    return array;
  },
  index<T>(array: T[] = [], index: number, value: T): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = {
      type: "change",
      index,
      item: value,
    };
    return array;
  },
  push<T>(array: T[] = [], ...items: T[]): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = {
      type: "push",
      items,
    };
    return array;
  },
  pop<T>(array: T[] = []): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = { type: "pop" };
    return array;
  },
  shift<T>(array: T[] = []): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = { type: "shift" };
    return array;
  },
  unshift<T>(array: T[] = [], ...items: T[]): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = {
      type: "unshift",
      items,
    };
    return array;
  },
  splice<T>(
    array: T[] = [],
    start: number,
    delete_count?: number,
    ...items: T[]
  ): StateArrayWrite<T> {
    (array as StateArrayWrite<T>)[ARRAY_WRITE_KEY] = {
      type: "splice",
      index: start,
      delete_count: delete_count ?? 0,
      items,
    };
    return array;
  },
};

export const ARRAY = {
  read<RT>(arr: readonly RT[]): StateArrayRead<RT> {
    return arr as StateArrayRead<RT>;
  },
  write,
  read_key: ARRAY_READ_KEY,
  write_key: ARRAY_WRITE_KEY,
};

export class ArrayOwner<T> implements StateArrayMethods<T> {
  #array: T[] & StateArrayReadTypes<T>;
  #setter: (v: ResultOk<T[] & StateArrayReadTypes<T>>) => void;
  constructor(
    result: Result<T[], string>,
    setter: (v: ResultOk<T[] & StateArrayReadTypes<T>>) => void,
  ) {
    this.#array = result.unwrap_or([]);
    this.#setter = setter;
  }
  get array(): readonly T[] {
    return this.#array;
  }
  get length(): number {
    return this.#array.length;
  }
  at(index: number): T | undefined {
    return this.#array[index];
  }
  set_index(index: number, value: T): void {
    this.#array[index] = value;
    this.#array[ARRAY_READ_KEY] = { type: "changed", index, items: [value] };
    this.#setter(ok(this.#array));
  }
  push(...items: T[]): number {
    const index = this.#array.length;
    const new_len = this.#array.push(...items);
    this.#array[ARRAY_READ_KEY] = { type: "added", index, items };
    this.#setter(ok(this.#array));
    return new_len;
  }
  pop(): T | undefined {
    const l = this.#array.length;
    const p = this.#array.pop();
    if (this.#array.length < l) {
      this.#array[ARRAY_READ_KEY] = {
        type: "removed",
        index: this.#array.length,
        items: [p!],
      };
      this.#setter(ok(this.#array));
    }
    return p;
  }
  shift(): T | undefined {
    const l = this.#array.length;
    const s = this.#array.shift();
    if (this.#array.length < l) {
      this.#array[ARRAY_READ_KEY] = {
        type: "removed",
        index: 0,
        items: [s!],
      };
      this.#setter(ok(this.#array));
    }
    return s;
  }
  unshift(...items: T[]): number {
    const new_len = this.#array.unshift(...items);
    this.#array[ARRAY_READ_KEY] = { type: "added", index: 0, items };
    this.#setter(ok(this.#array));
    return new_len;
  }
  splice(start: number, delete_count?: number, ...items: T[]): T[] {
    const r = this.#array.splice(start, delete_count!, ...items);
    if (r.length > 0)
      this.update_subs(ok(this.#mr("removed", start, r)) as RRT);
    if (items.length > 0)
      this.update_subs(ok(this.#mr("added", start, items)) as RRT);
    if (this.#length) this.#length.set_ok(this.#array.length);
    return r;
  }
  delete(val: T): void;
}
