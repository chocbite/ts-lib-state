import { number_step_start_decimal } from "@chocbite/ts-lib-math";
import {
  err,
  ok,
  Option,
  OptionSome,
  some,
  type Result,
} from "@chocbite/ts-lib-result";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import {
  STATE_ARRAY_WRITE_KEY,
  STATE_KEY,
  StateArrayRead,
  StateArrayWrite,
  type State,
  type StateREA,
  type StateREAW,
  type StateRelated,
  type StateRES,
  type StateRESW,
  type StateROA,
  type StateROAW,
  type StateROS,
  type StateROSW,
  type StateSub,
} from "./types";

//##################################################################################################################################################
//      ____           _____ ______
//     |  _ \   /\    / ____|  ____|
//     | |_) | /  \  | (___ | |__
//     |  _ < / /\ \  \___ \|  __|
//     | |_) / ____ \ ____) | |____
//     |____/_/    \_\_____/|______|
export interface StateRelatedBase extends StateRelated {
  writable?: State<boolean>;
}

export abstract class StateHelper<
  WT,
  REL extends Option<StateRelatedBase>,
> implements StateRelatedBase {
  readonly writable?: State<boolean>;

  constructor(writable?: State<boolean>) {
    if (writable) this.writable = writable;
  }

  abstract related(): REL;

  abstract limit(value: WT): Promise<Result<WT, string>>;

  abstract check(value: WT): Promise<Result<WT, string>>;
}

//##################################################################################################################################################
//      ____   ____   ____  _      ______          _   _
//     |  _ \ / __ \ / __ \| |    |  ____|   /\   | \ | |
//     | |_) | |  | | |  | | |    | |__     /  \  |  \| |
//     |  _ <| |  | | |  | | |    |  __|   / /\ \ | . ` |
//     | |_) | |__| | |__| | |____| |____ / ____ \| |\  |
//     |____/ \____/ \____/|______|______/_/    \_\_| \_|
export interface StateBooleanRelated extends StateRelatedBase {}

export class StateBooleanHelper
  extends StateHelper<boolean, OptionSome<StateBooleanRelated>>
  implements StateBooleanRelated
{
  async limit(value: boolean): Promise<Result<boolean, string>> {
    return ok(value);
  }

  async check(value: boolean): Promise<Result<boolean, string>> {
    if (this.writable !== undefined && !this.writable)
      return err("not writable");
    return ok(value);
  }

  related(): OptionSome<StateBooleanRelated> {
    return some(this);
  }
}

//##################################################################################################################################################
//      _   _ _    _ __  __ ____  ______ _____
//     | \ | | |  | |  \/  |  _ \|  ____|  __ \
//     |  \| | |  | | \  / | |_) | |__  | |__) |
//     | . ` | |  | | |\/| |  _ <|  __| |  _  /
//     | |\  | |__| | |  | | |_) | |____| | \ \
//     |_| \_|\____/|_|  |_|____/|______|_|  \_\
export interface StateNumberRelated extends StateRelatedBase {
  min?: State<number>;
  max?: State<number>;
  unit?: State<string>;
  decimals?: State<number>;
  step?: State<number>;
  start?: State<number>;
}

export class StateNumberHelper
  extends StateHelper<number, OptionSome<StateNumberRelated>>
  implements StateNumberRelated
{
  readonly min?: State<number>;
  readonly max?: State<number>;
  readonly unit?: State<string>;
  readonly decimals?: State<number>;
  readonly step?: State<number>;
  readonly start?: State<number>;

  constructor(
    min?: State<number>,
    max?: State<number>,
    unit?: State<string>,
    decimals?: State<number>,
    step?: State<number>,
    start?: State<number>,
    writable?: State<boolean>,
  ) {
    super(writable);
    if (min) this.min = min;
    if (max) this.max = max;
    if (unit) this.unit = unit;
    if (step) this.step = step;
    if (start) this.start = start;
    if (decimals) this.decimals = decimals;
  }

  async limit(value: number): Promise<Result<number, string>> {
    const [min, max, step, start, decimals] = await Promise.all([
      this.min,
      this.max,
      this.step,
      this.start,
      this.decimals,
    ]);
    return ok(
      Math.min(
        max?.unwrap_or(Infinity) ?? Infinity,
        Math.max(
          min?.unwrap_or(-Infinity) ?? -Infinity,
          number_step_start_decimal(
            value,
            step?.unwrap_or(undefined),
            start?.unwrap_or(undefined),
            decimals?.unwrap_or(undefined),
          ),
        ),
      ),
    );
  }

  async check(value: number): Promise<Result<number, string>> {
    const [min, max] = await Promise.all([this.min, this.max]);
    if (max?.ok && value > max.value)
      return err(value + " is bigger than the limit of " + max.value);
    if (min?.ok && value < min.value)
      return err(value + " is smaller than the limit of " + min.value);
    return ok(value);
  }

  related(): OptionSome<StateNumberRelated> {
    return some(this);
  }
}

const nums = {
  /**Number limiter struct
   * @param min minimum allowed number
   * @param max maximum allowed number
   * @param unit unit for number
   * @param decimals number of suggested decimals to show
   * @param step allowed step size for number 0.1 allows 0,0.1,0.2,0.3...
   * @param start start offset for step, 0.5 and step 2 allows 0.5,2.5,4.5,6.5*/
  helper(
    min?: State<number>,
    max?: State<number>,
    unit?: State<string>,
    decimals?: State<number>,
    step?: State<number>,
    start?: State<number>,
    writable?: State<boolean>,
  ) {
    return new StateNumberHelper(
      min,
      max,
      unit,
      decimals,
      step,
      start,
      writable,
    );
  },
};

//##################################################################################################################################################
//       _____ _______ _____  _____ _   _  _____
//      / ____|__   __|  __ \|_   _| \ | |/ ____|
//     | (___    | |  | |__) | | | |  \| | |  __
//      \___ \   | |  |  _  /  | | | . ` | | |_ |
//      ____) |  | |  | | \ \ _| |_| |\  | |__| |
//     |_____/   |_|  |_|  \_\_____|_| \_|\_____|
export interface StateStringRelated extends StateRelatedBase {
  max_length?: State<number>;
  max_length_bytes?: State<number>;
}

export class StateStringHelper
  extends StateHelper<string, OptionSome<StateStringRelated>>
  implements StateStringRelated
{
  max_length?: State<number>;
  max_length_bytes?: State<number>;
  constructor(
    max_length?: State<number>,
    max_length_bytes?: State<number>,
    writable?: State<boolean>,
  ) {
    super(writable);
    if (max_length) this.max_length = max_length;
    if (max_length_bytes) this.max_length_bytes = max_length_bytes;
  }

  async limit(value: string): Promise<Result<string, string>> {
    const [max_length, max_length_bytes] = await Promise.all([
      this.max_length,
      this.max_length_bytes,
    ]);
    if (max_length?.ok && value.length > max_length.value)
      value = value.slice(0, max_length.value);
    if (max_length_bytes?.ok) {
      value = new TextDecoder().decode(
        new TextEncoder().encode(value).slice(0, max_length_bytes.value),
      );
      if (value.at(-1)?.charCodeAt(0) === 65533) value = value.slice(0, -1);
    }
    return ok(value);
  }
  async check(value: string): Promise<Result<string, string>> {
    const [max_length, max_length_bytes] = await Promise.all([
      this.max_length,
      this.max_length_bytes,
    ]);
    if (max_length?.ok && value.length > max_length.value)
      return err(
        "the text is longer than the limit of " +
          max_length.value +
          " characters",
      );
    if (
      max_length_bytes?.ok &&
      new TextEncoder().encode(value).length > max_length_bytes.value
    )
      return err(
        "the text is longer than the limit of " +
          max_length_bytes.value +
          " bytes",
      );
    return ok(value);
  }
  related(): OptionSome<StateStringRelated> {
    return some(this);
  }
}

const strings = {
  /**String limiter struct
   * @param max_length max length for string
   * @param max_length_bytes max byte length for string*/
  helper(
    max_length?: State<number>,
    max_length_bytes?: State<number>,
    writable?: State<boolean>,
  ) {
    return new StateStringHelper(max_length, max_length_bytes, writable);
  },
};

//##################################################################################################################################################
//      ______ _   _ _    _ __  __
//     |  ____| \ | | |  | |  \/  |
//     | |__  |  \| | |  | | \  / |
//     |  __| | . ` | |  | | |\/| |
//     | |____| |\  | |__| | |  | |
//     |______|_| \_|\____/|_|  |_|
type EnumHelperEntry = {
  name: string;
  description?: string;
  icon?: SVGFunc;
};

type StateEnumHelperList<K extends PropertyKey> = {
  [P in K]: EnumHelperEntry;
};

export interface StateEnumRelated<
  L extends StateEnumHelperList<PropertyKey> = StateEnumHelperList<PropertyKey>,
> extends StateRelatedBase {
  list: State<L>;
}

export class StateEnumHelper<
  L extends StateEnumHelperList<PropertyKey> = StateEnumHelperList<PropertyKey>,
  K extends PropertyKey = keyof L,
  R extends StateRelatedBase = StateEnumRelated<L>,
>
  extends StateHelper<K, OptionSome<R>>
  implements StateEnumRelated<L>
{
  readonly list: State<L>;

  constructor(list: State<L>, writable?: State<boolean>) {
    super(writable);
    this.list = list;
  }

  async limit(value: K): Promise<Result<K, string>> {
    return ok(value);
  }

  async check(value: K): Promise<Result<K, string>> {
    const list = await this.list;
    if (list.err) return err("list is not available");
    if (value in list.value) return ok(value);
    return err(String(value) + " is not in list");
  }

  related(): OptionSome<R> {
    return some(this as unknown as R);
  }
}

const enums = {
  /**Creates an enum helper struct, use list method to make a list with correct typing*/
  helper<
    L extends StateEnumHelperList<PropertyKey>,
    K extends PropertyKey = keyof L,
    R extends StateRelatedBase = StateEnumRelated<L>,
  >(list: State<L>, writable?: State<boolean>) {
    return new StateEnumHelper<L, K, R>(list, writable);
  },
  /**Creates an enum description list, passing the enum as a generic type to this function makes things look a bit nicer */
  list<K extends PropertyKey>(list: StateEnumHelperList<K>): typeof list {
    return list;
  },
  /**Maps over an enum description list
   * @param list enum description list
   * @param func function to apply to each entry
   * @returns array of results*/
  map<K extends PropertyKey, R>(
    list: StateEnumHelperList<K>,
    func: (key: K, val: EnumHelperEntry) => R,
  ): R[] {
    return Object.keys(list).map((key) => func(key as K, list[key as K]));
  },
};

//##################################################################################################################################################
//      ______ _    _ _   _  _____ _______ _____ ____  _   _  _____
//     |  ____| |  | | \ | |/ ____|__   __|_   _/ __ \| \ | |/ ____|
//     | |__  | |  | |  \| | |       | |    | || |  | |  \| | (___
//     |  __| | |  | | . ` | |       | |    | || |  | | . ` |\___ \
//     | |    | |__| | |\  | |____   | |   _| || |__| | |\  |____) |
//     |_|     \____/|_| \_|\_____|  |_|  |_____\____/|_| \_|_____/

/**Waits for a state to have a specific value or until timeout is reached
 * @param value value to wait for
 * @param state state to wait on
 * @param timeout timeout in milliseconds, default 500ms
 * @returns true if value was reached before timeout, false if timeout was reached*/
async function await_value<T>(
  value: T,
  state: State<T>,
  timeout: number = 500,
): Promise<boolean> {
  let func: StateSub<Result<T, string>> = () => {};
  const res = await Promise.race([
    new Promise<false>((a) => setTimeout(a, timeout, false)),
    new Promise<true>((a) => {
      func = state.sub((res) => {
        if (res.ok && res.value === value) a(true);
      });
    }),
  ]);
  state.unsub(func);
  return res;
}

//##################################################################################################################################################
/**Compare two states for equality
 * @param state1 first state
 * @param state2 second state
 * @returns true if states are equal*/
async function compare(
  state1: State<any>,
  state2: State<any>,
): Promise<boolean> {
  const res1 = await state1;
  const res2 = await state2;
  if (res1.err || res2.err) return false;
  return res1.value === res2.value;
}

//##################################################################################################################################################
/**Compare two sync states for equality
 * @param state1 first state
 * @param state2 second state
 * @returns true if states are equal*/
function compare_sync(state1: StateRES<any>, state2: StateRES<any>): boolean {
  const res1 = state1.get();
  const res2 = state2.get();
  if (res1.err || res2.err) return true;
  return res1.value !== res2.value;
}

//##################################################################################################################################################
const is = {
  rea(s: any): s is StateREA<any> {
    return Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]);
  },
  roa(s: any): s is StateROA<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).rok
    );
  },
  res(s: any): s is StateRES<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).rsync
    );
  },
  ros(s: any): s is StateROS<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).rsync &&
      (s as State<any>).rok
    );
  },
  reaw(s: any): s is StateREAW<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).writable
    );
  },
  roaw(s: any): s is StateROAW<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).writable &&
      (s as State<any>).rok
    );
  },
  resw(s: any): s is StateRESW<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).writable &&
      (s as State<any>).rsync
    );
  },
  rosw(s: any): s is StateROSW<any> {
    return (
      Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]) &&
      (s as State<any>).writable &&
      (s as State<any>).rsync &&
      (s as State<any>).rok
    );
  },
};

//##################################################################################################################################################
//               _____  _____        __     __
//         /\   |  __ \|  __ \     /\\ \   / /
//        /  \  | |__) | |__) |   /  \\ \_/ /
//       / /\ \ |  _  /|  _  /   / /\ \\   /
//      / ____ \| | \ \| | \ \  / ____ \| |
//     /_/    \_\_|  \_\_|  \_\/_/    \_\_|
const array = {
  read<RT>(arr: readonly RT[]): StateArrayRead<RT> {
    return arr as StateArrayRead<RT>;
  },
  //# Array Write Helpers
  write<T>(items: T[]): StateArrayWrite<T> {
    (items as StateArrayWrite<T>)[STATE_ARRAY_WRITE_KEY] = {
      type: "fresh",
      items,
    };
    return items;
  },
  index<T>(index: number, value: T): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = {
      type: "change",
      index,
      item: value,
    };
    return arr;
  },
  push<T>(...items: T[]): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = { type: "push", items };
    return arr;
  },
  pop<T>(): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = { type: "pop" };
    return arr;
  },
  shift<T>(): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = { type: "shift" };
    return arr;
  },
  unshift<T>(...items: T[]): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = { type: "unshift", items };
    return arr;
  },
  splice<T>(
    start: number,
    delete_count?: number,
    ...items: T[]
  ): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = {
      type: "splice",
      index: start,
      delete_count: delete_count ?? 0,
      items,
    };
    return arr;
  },
  pluck<T>(index: number): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = { type: "splice", index, delete_count: 1 };
    return arr;
  },
  insert<T>(index: number, ...items: T[]): StateArrayWrite<T> {
    const arr = [] as StateArrayWrite<T>;
    arr[STATE_ARRAY_WRITE_KEY] = {
      type: "splice",
      index,
      delete_count: 0,
      items,
    };
    return arr;
  },
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Helper function and types for states */
export const STATE_HELPERS = {
  is,
  nums,
  strings,
  enums,
  await_value,
  compare,
  compare_sync,
  array,
};
