import { STATE_ARRAY } from "./array/sync";
import { StateBase } from "./base";
import { STATE_COLLECTS_NUMBER } from "./collected/number";
import { STATE_COLLECTED_REA } from "./collected/rea";
import { STATE_COLLECTED_RES } from "./collected/res";
import { STATE_COLLECTED_ROA } from "./collected/roa";
import { STATE_COLLECTED_ROS } from "./collected/ros";
import { STATE_DELAYED } from "./delayed/delayed";
import { STATE_HELPERS } from "./helpers";
import { STATE_LAZY } from "./lazy/lazy";
import { STATE_PROXY_REA } from "./proxy/rea";
import { STATE_PROXY_RES } from "./proxy/res";
import { STATE_PROXY_ROA } from "./proxy/roa";
import { STATE_PROXY_ROS } from "./proxy/ros";
import { STATE_RESOURCE_REA } from "./resource/rea";
import { STATE_RESOURCE_ROA } from "./resource/roa";
import { STATE_SYNC } from "./sync/sync";
import { STATE_KEY, type State } from "./types";

export const state = {
  /**The state key is a symbol used to identify state objects
   * To implement a custom state, set this key to true on the object */
  STATE_KEY,
  a: STATE_ARRAY,
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
  is(s: unknown): s is State<any, any> {
    //@ts-expect-error Will not crash
    return Boolean(s) && s[STATE_KEY] === true;
  },
  /**Utility base class for state, with basic state functionality */
  class: StateBase,
  ok: STATE_SYNC.ros.ok,
  err: STATE_SYNC.res.err,
  from: STATE_SYNC.res.ok,
  ok_ws: STATE_SYNC.ros_ws.ok,
  err_ws: STATE_SYNC.res_ws.err,
  from_ws: STATE_SYNC.res_ws.ok,
};
export default state;

export {
  type StateArrayRead,
  type StateArrayReadType,
  type StateArraySyncRES,
  type StateArraySyncRESWS,
  type StateArraySyncROS,
  type StateArraySyncROSWS,
  type StateArrayWrite,
} from "./array/sync";
export { type StateCollectedREA } from "./collected/rea";
export { type StateCollectedRES } from "./collected/res";
export { type StateCollectedROA } from "./collected/roa";
export { type StateCollectedROS } from "./collected/ros";
export {
  type StateDelayedREA,
  type StateDelayedREAW,
  type StateDelayedROA,
  type StateDelayedROAW,
} from "./delayed/delayed";
export {
  StateEnumHelper,
  StateNumberHelper,
  StateStringHelper,
  type StateEnumRelated,
  type StateNumberRelated,
  type StateStringRelated,
} from "./helpers";
export {
  type StateLazyRES,
  type StateLazyRESW as StateLazyRESWS,
  type StateLazyROS,
  type StateLazyROSW as StateLazyROSWS,
} from "./lazy/lazy";
export {
  type StateProxyREA,
  type StateProxyREAW as StateProxyREAWA,
} from "./proxy/rea";
export {
  type StateProxyRES,
  type StateProxyRESW as StateProxyRESWA,
} from "./proxy/res";
export {
  type StateProxyROA,
  type StateProxyROAW as StateProxyROAWA,
} from "./proxy/roa";
export {
  type StateProxyROS,
  type StateProxyROSW as StateProxyROSWA,
} from "./proxy/ros";
export {
  type StateResourceFuncREA,
  type StateResourceFuncREAWA,
  type StateResourceREA,
  type StateResourceREAWA,
} from "./resource/rea";
export {
  type StateResourceFuncROA,
  type StateResourceROA,
} from "./resource/roa";
export {
  type StateSyncRES,
  type StateSyncRESW as StateSyncRESWS,
  type StateSyncROS,
  type StateSyncROSW as StateSyncROSWS,
} from "./sync/sync";

//       _____ _______    _______ ______   _________     _______  ______  _____
//      / ____|__   __|/\|__   __|  ____| |__   __\ \   / /  __ \|  ____|/ ____|
//     | (___    | |  /  \  | |  | |__       | |   \ \_/ /| |__) | |__  | (___
//      \___ \   | | / /\ \ | |  |  __|      | |    \   / |  ___/|  __|  \___ \
//      ____) |  | |/ ____ \| |  | |____     | |     | |  | |    | |____ ____) |
//     |_____/   |_/_/    \_\_|  |______|    |_|     |_|  |_|    |______|_____/
export type {
  State,
  StateArray,
  StateArrayREA,
  StateArrayREAW,
  StateArrayRES,
  StateArrayRESW,
  StateArrayROA,
  StateArrayROAW,
  StateArrayROS,
  StateArrayROSW,
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
