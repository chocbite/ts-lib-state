import { StateBase } from "./base";
import { STATE_COLLECTS_NUMBER } from "./collected/number";
import { STATE_COLLECTED_REA } from "./collected/rea";
import { STATE_COLLECTED_RES } from "./collected/res";
import { STATE_COLLECTED_ROA } from "./collected/roa";
import { STATE_COLLECTED_ROS } from "./collected/ros";
import { STATE_HELPERS } from "./helpers";
import { STATE_DELAYED, STATE_LAZY, STATE_SYNC } from "./normal";
import { STATE_PROXY_REA } from "./proxy/rea";
import { STATE_PROXY_RES } from "./proxy/res";
import { STATE_PROXY_ROA } from "./proxy/roa";
import { STATE_PROXY_ROS } from "./proxy/ros";
import { STATE_RESOURCE_REA } from "./resource/rea";
import { STATE_RESOURCE_ROA } from "./resource/roa";
import { STATE_KEY, type State } from "./types";

export const state = {
  /**The state key is a symbol used to identify state objects
   * To implement a custom state, set this key to true on the object */
  STATE_KEY,
  /**Collected states, collects values from multiple states and reduces it to one */
  c: {
    rea: STATE_COLLECTED_REA,
    res: STATE_COLLECTED_RES,
    roa: STATE_COLLECTED_ROA,
    ros: STATE_COLLECTED_ROS,
    num: STATE_COLLECTS_NUMBER,
  },
  d: STATE_DELAYED,
  h: STATE_HELPERS,
  l: STATE_LAZY,
  p: {
    ...STATE_PROXY_REA,
    ...STATE_PROXY_RES,
    ...STATE_PROXY_ROA,
    ...STATE_PROXY_ROS,
  },
  r: { ...STATE_RESOURCE_REA, ...STATE_RESOURCE_ROA },
  s: STATE_SYNC,
  /**Returns true if the given object promises to be a state */
  is(s: any): s is State<any, any> {
    return Boolean(s && (s as { [STATE_KEY]: boolean })[STATE_KEY]);
  },
  /**Utility base class for state, with basic state functionality */
  class: StateBase,
  ok: STATE_SYNC.ros.ok,
  err: STATE_SYNC.res.err,
  from: STATE_SYNC.res.ok,
  ok_ws: STATE_SYNC.rosw.ok,
  err_ws: STATE_SYNC.resw.err,
  from_ws: STATE_SYNC.resw.ok,
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
export { type StateProxyREA, type StateProxyREAW } from "./proxy/rea";
export { type StateProxyRES, type StateProxyRESW } from "./proxy/res";
export { type StateProxyROA, type StateProxyROAW } from "./proxy/roa";
export { type StateProxyROS, type StateProxyROSW } from "./proxy/ros";
export {
  type StateResourceFuncREA,
  type StateResourceFuncREAW,
  type StateResourceREA,
  type StateResourceREAW,
} from "./resource/rea";
export {
  type StateResourceFuncROA,
  type StateResourceROA,
} from "./resource/roa";

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
