import {
  none,
  ok,
  Option,
  OptionNone,
  type Result,
} from "@chocbite/ts-lib-result";
import {
  StateHelper,
  StateRelated,
  type State,
  type StateRES,
  type StateSub,
} from "../types";

export type StateInit<T = any> =
  | Result<T, string>
  | (() => Result<T, string>)
  | (() => Promise<Result<T, string>>)
  | undefined;

export type StateInitResult<T> = T extends () => Promise<infer R>
  ? R
  : T extends () => infer R
    ? R
    : T extends Result<any, string>
      ? T
      : never;

export interface StateRelatedBase extends StateRelated {
  writable?: State<boolean>;
}

export interface StateHelperBaseOptions {
  writable?: State<boolean>;
}

export abstract class StateHelperBase<
  RRT extends Result<any, string>,
  WT,
  REL extends Option<StateRelatedBase>,
>
  implements StateHelper<RRT, WT, REL>, StateRelatedBase
{
  readonly writable?: State<boolean>;

  constructor(options: StateHelperBaseOptions) {
    if (options.writable) this.writable = options.writable;
  }

  /**Called by state when value is set */
  protected set(_value: RRT): void {}

  abstract related(): REL;

  abstract limit(value: WT): Promise<Result<WT, string>>;

  abstract check(value: WT): Promise<Result<WT, string>>;
}

export class StateNoHelper implements StateHelper<any, any, OptionNone> {
  /**Called by state when value is set */
  protected set(_value: any): void {}

  related(): OptionNone {
    return none();
  }

  limit(value: any): Promise<any> {
    return Promise.resolve(ok(value));
  }

  check(value: any): Promise<any> {
    return Promise.resolve(ok(value));
  }
}

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
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Helper function and types for states */
export const HELPERS = {
  await_value,
  compare,
  compare_sync,
};
