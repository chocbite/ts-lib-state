import { type Result } from "@chocbite/ts-lib-result";
import {
  STATE_KEY,
  type State,
  type StateREA,
  type StateREAW,
  type StateRES,
  type StateRESW,
  type StateROA,
  type StateROAW,
  type StateROS,
  type StateROSW,
  type StateSub,
} from "./types";

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
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**Helper function and types for states */
export const HELPERS = {
  is,
  await_value,
  compare,
  compare_sync,
};
