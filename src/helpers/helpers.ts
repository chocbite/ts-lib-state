import { sync_resolve } from "@chocbite/ts-lib-common";
import { none, ok, Option, OptionNone } from "@chocbite/ts-lib-result";
import {
  StateResult as SR,
  StateHelper,
  StateRelated,
  type State,
} from "../types";

export type StateInit<T = any> =
  | SR<T>
  | (() => SR<T>)
  | (() => PromiseLike<SR<T>>)
  | undefined;

export type StateInitResult<T> = T extends () => PromiseLike<infer R>
  ? R
  : T extends () => infer R
    ? R
    : T extends SR<any>
      ? T
      : never;

export interface StateRelatedBase extends StateRelated {
  writable?: State<boolean>;
}

export interface StateHelperBaseOptions {
  writable?: State<boolean>;
}

export abstract class StateHelperBase<
  RRT extends SR<any>,
  WT,
  REL extends Option<StateRelatedBase>,
>
  implements StateHelper<RRT, WT, REL>, StateRelatedBase
{
  readonly writable?: State<boolean>;

  constructor(options?: StateHelperBaseOptions) {
    if (options?.writable) this.writable = options.writable;
  }

  /**Called by state when value is set */
  on_change(_value: RRT): void {}

  abstract related(): REL;

  abstract limit(value: WT): PromiseLike<SR<WT>>;

  abstract check(value: WT): PromiseLike<SR<WT>>;
}

export class StateNoHelper implements StateHelper<any, any, OptionNone> {
  /**Called by state when value is set */
  protected set(_value: any): void {}

  related(): OptionNone {
    return none();
  }

  limit(value: any): PromiseLike<any> {
    return sync_resolve(ok(value));
  }

  check(value: any): PromiseLike<any> {
    return sync_resolve(ok(value));
  }
}
