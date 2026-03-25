import { StateBase } from "./base";
import { COLLECTED } from "./collected";
import { HELPERS } from "./helpers";
import { ARRAY } from "./helpers/array";
import { BOOL } from "./helpers/boolean";
import { ENUM } from "./helpers/enum";
import { IS } from "./helpers/is";
import { NUMBER } from "./helpers/number";
import { STRING } from "./helpers/string";
import { DELAYED, LAZY, SYNC } from "./normal";
import { PROXY } from "./proxy";
import { RESOURCE } from "./resource";
import { STATE_KEY } from "./types";

export const state = {
  //Quick access states
  ok: SYNC.ros.ok,
  err: SYNC.res.err,
  from: SYNC.res.ok,
  ok_ws: SYNC.rosw.ok,
  err_ws: SYNC.resw.err,
  from_ws: SYNC.resw.ok,
  /**Collected states, collects values from multiple states and reduces it to one */
  c: COLLECTED,
  d: DELAYED,
  h: HELPERS,
  l: LAZY,
  p: PROXY,
  r: RESOURCE,
  s: SYNC,
  //Helpers
  array: ARRAY,
  number: NUMBER,
  string: STRING,
  enum: ENUM,
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
