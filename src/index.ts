import { err, ok, Result } from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import { COLLECTED } from "./collected";
import { ARRAY } from "./helpers/array";
import { BOOL } from "./helpers/boolean";
import { ENUM } from "./helpers/enum";
import { HELPERS } from "./helpers/helpers";
import { IS } from "./helpers/is";
import { NUMBER } from "./helpers/number";
import { STRING } from "./helpers/string";
import { rea, reaw, res, resw, roa, roaw, ros, rosw } from "./normal";
import { PROXY } from "./proxy";
import { RESOURCE } from "./resource";
import { STATE_KEY } from "./types";

export const state = {
  //Quick access states
  /**Creates an ok state with the given initial value */
  ok<RT>(init: RT) {
    return ros(ok(init));
  },
  /**Creates an error state with the given initial error message */
  err<RT>(init: string) {
    return res(err(init) as Result<RT, string>);
  },
  /**Creates an errorable state with the given initial value */
  from<RT>(init: RT) {
    return res(ok(init) as Result<RT, string>);
  },
  /**Creates a writable ok state with the given initial value */
  ok_w<RT>(init: RT) {
    return rosw(ok(init));
  },
  /**Creates a writable error state with the given initial error message */
  err_w<RT>(init: string) {
    return resw(err(init) as Result<RT, string>);
  },
  /**Creates a writable errorable state with the given initial value */
  from_w<RT>(init: RT) {
    return resw(ok(init) as Result<RT, string>);
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
  /**Resource states, allows for creating states representing remote resources */
  r: RESOURCE,
  resource: RESOURCE,
  //Helpers
  h: HELPERS,
  helpers: HELPERS,
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
export { StateArrayHelper, type StateArrayRelated } from "./helpers/array";
export { StateBoolHelper, type StateBoolRelated } from "./helpers/boolean";
export { StateEnumHelper, type StateEnumRelated } from "./helpers/enum";
export { StateNumberHelper, type StateNumberRelated } from "./helpers/number";
export { StateStringHelper, type StateStringRelated } from "./helpers/string";
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
  type StateResource,
  type StateResourceFuncREA,
  type StateResourceFuncREAW,
  type StateResourceFuncROA,
  type StateResourceFuncROAW,
} from "./resource";

//       _____ _______    _______ ______   _________     _______  ______  _____
//      / ____|__   __|/\|__   __|  ____| |__   __\ \   / /  __ \|  ____|/ ____|
//     | (___    | |  /  \  | |  | |__       | |   \ \_/ /| |__) | |__  | (___
//      \___ \   | | / /\ \ | |  |  __|      | |    \   / |  ___/|  __|  \___ \
//      ____) |  | |/ ____ \| |  | |____     | |     | |  | |    | |____ ____) |
//     |_____/   |_/_/    \_\_|  |______|    |_|     |_|  |_|    |______|_____/
export type {
  State,
  StateInferResult,
  StateInferSub,
  StateInferType,
  StateREA,
  StateREAW,
  StateRES,
  StateRESW,
  StateROA,
  StateROAW,
  StateROS,
  StateROSW,
  StateSub,
} from "./types";
