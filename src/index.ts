import { err, ok } from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import { COLLECTED } from "./collected";
import { ARRAY } from "./helpers/array";
import { BOOL } from "./helpers/boolean";
import { ENUM } from "./helpers/enum";
import { IS } from "./helpers/is";
import { NUMBER } from "./helpers/number";
import { STRING } from "./helpers/string";
import { UTIL } from "./helpers/util";
import { rea, reaw, res, resw, roa, roaw, ros, rosw } from "./normal";
import { PROXY } from "./proxy";
import { RESOURCE } from "./remote";
import { StateResult as SR, STATE_KEY } from "./types";

export const state = {
  //Quick access states
  /**Creates an ok state with the given initial value */
  ok<RT>(init: RT) {
    return ros(ok(init));
  },
  /**Creates an error state with the given initial error message */
  err<RT>(init: string) {
    return res(err(init) as SR<RT>);
  },
  /**Creates an errorable state with the given initial value */
  from<RT>(init: RT) {
    return res(ok(init) as SR<RT>);
  },
  /**Creates a writable ok state with the given initial value */
  ok_w<RT>(init: RT) {
    return rosw(ok(init));
  },
  /**Creates a writable error state with the given initial error message */
  err_w<RT>(init: string) {
    return resw(err(init) as SR<RT>);
  },
  /**Creates a writable errorable state with the given initial value */
  from_w<RT>(init: RT) {
    return resw(ok(init) as SR<RT>);
  },
  //Normal
  ros,
  rosw,
  res,
  resw,
  roa,
  roaw,
  rea,
  reaw,
  /**Proxy states, allows for creating states that proxy other states */
  p: PROXY,
  proxy: PROXY,
  /**Collected states, collects values from multiple states and reduces it to one */
  c: COLLECTED,
  collected: COLLECTED,
  /**Remote states, allows for creating states representing remote resources */
  r: RESOURCE,
  remote: RESOURCE,
  /**Helper functionality for arrays */
  a: ARRAY,
  array: ARRAY,
  /**Helper functionality for numbers */
  n: NUMBER,
  number: NUMBER,
  /**Helper functionality for strings */
  s: STRING,
  string: STRING,
  /**Helper functionality for enums */
  e: ENUM,
  enum: ENUM,
  /**Helper functionality for booleans */
  b: BOOL,
  bool: BOOL,
  /**Utility functions for states */
  u: UTIL,
  util: UTIL,
  /**Functions to determine if a variable is a state*/
  is: IS,
  /**The state key is a symbol used to identify state objects
   * To implement a custom state, set this key to true on the object */
  STATE_KEY,
  /**Utility base class for state, with basic state functionality */
  class: StateBase,
};
export default state;

export {
  type StateCollectedREA,
  type StateCollectedRES,
  type StateCollectedROA,
  type StateCollectedROS,
} from "./collected";
export {
  STATE_ARRAY_HELPER_KEY,
  STATE_ARRAY_READ_KEY,
  STATE_ARRAY_RELATED_KEY,
  STATE_ARRAY_WRITE_KEY,
  StateArrayHelper,
  type StateArrayRead,
  type StateArrayRelated,
} from "./helpers/array";
export {
  STATE_BOOL_HELPER_KEY,
  STATE_BOOL_RELATED_KEY,
  StateBoolHelper,
  type StateBoolRelated,
} from "./helpers/boolean";
export {
  STATE_ENUM_HELPER_KEY,
  STATE_ENUM_RELATED_KEY,
  StateEnumHelper,
  type StateEnumRelated,
} from "./helpers/enum";
export {
  STATE_NUMBER_HELPER_KEY,
  STATE_NUMBER_RELATED_KEY,
  StateNumberHelper,
  type StateNumberRelated,
} from "./helpers/number";
export {
  STATE_STRING_HELPER_KEY,
  STATE_STRING_RELATED_KEY,
  StateStringHelper,
  type StateStringRelated,
} from "./helpers/string";
export {
  type StateNormalREA,
  type StateNormalREAW,
  type StateNormalRES,
  type StateNormalRESW,
  type StateNormalROA,
  type StateNormalROAW,
  type StateNormalROS,
  type StateNormalROSW,
} from "./normal";
export {
  type StateProxyREA,
  type StateProxyREAW,
  type StateProxyRES,
  type StateProxyRESW,
  type StateProxyROA,
  type StateProxyROAW,
  type StateProxyROS,
  type StateProxyROSW,
} from "./proxy";
export {
  type StateRemote as StateResource,
  type StateRemoteFuncREA as StateResourceFuncREA,
  type StateRemoteFuncREAW as StateResourceFuncREAW,
  type StateRemoteFuncROA as StateResourceFuncROA,
  type StateRemoteFuncROAW as StateResourceFuncROAW,
} from "./remote";

//       _____ _______    _______ ______   _________     _______  ______  _____
//      / ____|__   __|/\|__   __|  ____| |__   __\ \   / /  __ \|  ____|/ ____|
//     | (___    | |  /  \  | |  | |__       | |   \ \_/ /| |__) | |__  | (___
//      \___ \   | | / /\ \ | |  |  __|      | |    \   / |  ___/|  __|  \___ \
//      ____) |  | |/ ____ \| |  | |____     | |     | |  | |    | |____ ____) |
//     |_____/   |_/_/    \_\_|  |______|    |_|     |_|  |_|    |______|_____/
export type {
  State,
  STATE_KEY,
  StateInferResult,
  StateInferSub,
  StateInferType,
  StateREA,
  StateREAW,
  StateRES,
  StateResult,
  StateRESW,
  StateROA,
  StateROAW,
  StateROS,
  StateROSW,
  StateSub,
} from "./types";
