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
  | (() => Promise<SR<T>>)
  | undefined;

export type StateInitResult<T> = T extends () => Promise<infer R>
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

  constructor(options: StateHelperBaseOptions) {
    if (options.writable) this.writable = options.writable;
  }

  /**Called by state when value is set */
  protected set(_value: RRT): void {}

  abstract related(): REL;

  abstract limit(value: WT): Promise<SR<WT>>;

  abstract check(value: WT): Promise<SR<WT>>;
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
