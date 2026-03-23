import { StateBase } from "./base";
import { COLLECTS_NUMBER } from "./collected/number";
import { COLLECTED_REA } from "./collected/rea";
import { COLLECTED_RES } from "./collected/res";
import { COLLECTED_ROA } from "./collected/roa";
import { COLLECTED_ROS } from "./collected/ros";
import { ARRAY, HELPERS } from "./helpers";
import { DELAYED, LAZY, SYNC } from "./normal";
import { PROXY } from "./proxy";
import { RESOURCE } from "./resource";
import { STATE_KEY, type State } from "./types";

export const state = {
  /**The state key is a symbol used to identify state objects
   * To implement a custom state, set this key to true on the object */
  STATE_KEY,
  a: ARRAY,
  /**Collected states, collects values from multiple states and reduces it to one */
  c: {
    rea: COLLECTED_REA,
    res: COLLECTED_RES,
    roa: COLLECTED_ROA,
    ros: COLLECTED_ROS,
    num: COLLECTS_NUMBER,
  },
  d: DELAYED,
  h: HELPERS,
  l: LAZY,
  p: PROXY,
  r: RESOURCE,
  s: SYNC,
  /**Returns true if the given object promises to be a state */
  is(s: any): s is State<any, any> {
    return Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]);
  },
  /**Utility base class for state, with basic state functionality */
  class: StateBase,
  ok: SYNC.ros.ok,
  err: SYNC.res.err,
  from: SYNC.res.ok,
  ok_ws: SYNC.rosw.ok,
  err_ws: SYNC.resw.err,
  from_ws: SYNC.resw.ok,
};
export default state;

export { type StateCollectedREA } from "./collected/rea";
export { type StateCollectedRES } from "./collected/res";
export { type StateCollectedROA } from "./collected/roa";
export { type StateCollectedROS } from "./collected/ros";
export {
  StateEnumHelper,
  StateNumberHelper,
  StateStringHelper,
  type StateEnumRelated,
  type StateNumberRelated,
  type StateStringRelated,
} from "./helpers";
export {
  type StateDelayedREA,
  type StateDelayedREAW,
  type StateDelayedROA,
  type StateDelayedROAW,
  type StateLazyRES,
  type StateLazyRESW,
  type StateLazyROS,
  type StateLazyROSW,
  type StateSyncRES,
  type StateSyncRESW,
  type StateSyncROS,
  type StateSyncROSW,
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
