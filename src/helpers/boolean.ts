import { err, ok, OptionSome, some } from "@chocbite/ts-lib-result";
import { StateResult as SR } from "../types";
import {
  StateInit as Init,
  StateHelperBase,
  StateHelperBaseOptions,
  StateRelatedBase,
} from "./helpers";

export const STATE_BOOL_RELATED_KEY = Symbol("state_bool_related");
export const STATE_BOOL_HELPER_KEY = Symbol("state_bool_helper");

export interface StateBoolRelated extends StateRelatedBase {
  readonly [STATE_BOOL_RELATED_KEY]: true;
}

export interface StateBoolHelperOptions extends StateHelperBaseOptions {}

export class StateBoolHelper
  extends StateHelperBase<SR<boolean>, boolean, OptionSome<StateBoolRelated>>
  implements StateBoolRelated
{
  get [STATE_BOOL_RELATED_KEY](): true {
    return true;
  }
  get [STATE_BOOL_HELPER_KEY](): true {
    return true;
  }

  async limit(value: boolean): Promise<SR<boolean>> {
    return ok(value);
  }

  async check(value: boolean): Promise<SR<boolean>> {
    if (this.writable !== undefined && !this.writable)
      return err("not writable");
    return ok(value);
  }

  related(): OptionSome<StateBoolRelated> {
    return some(this);
  }
}

export const BOOL = {
  /**Unique key to check if object is a boolean related */
  RELATED_KEY: STATE_BOOL_RELATED_KEY,
  /**Returns true if object is a boolean related */
  is_related(r: any): r is StateBoolRelated {
    return Boolean(
      r && (r as { [STATE_BOOL_RELATED_KEY]: boolean })[STATE_BOOL_RELATED_KEY],
    );
  },
  /**Unique key to check if object is a boolean helper */
  HELPER_KEY: STATE_BOOL_HELPER_KEY,
  /**Returns true if object is a boolean helper */
  is_helper(h: any): h is StateBoolHelper {
    return Boolean(
      h && (h as { [STATE_BOOL_HELPER_KEY]: boolean })[STATE_BOOL_HELPER_KEY],
    );
  },
  /**Boolean helper*/
  help<I extends Init<boolean>>(
    init: I,
    options: StateBoolHelperOptions,
  ): [I, StateBoolHelper] {
    return [init, new StateBoolHelper(options)];
  },
};
