import { err, ok, OptionSome, Result, some } from "@chocbite/ts-lib-result";
import {
  StateInit as Init,
  StateHelperBase,
  StateHelperBaseOptions,
  StateRelatedBase,
} from "./helpers";

export interface StateBoolRelated extends StateRelatedBase {}

export interface StateBoolHelperOptions extends StateHelperBaseOptions {}

export class StateBoolHelper
  extends StateHelperBase<
    Result<boolean, string>,
    boolean,
    OptionSome<StateBoolRelated>
  >
  implements StateBoolRelated
{
  async limit(value: boolean): Promise<Result<boolean, string>> {
    return ok(value);
  }

  async check(value: boolean): Promise<Result<boolean, string>> {
    if (this.writable !== undefined && !this.writable)
      return err("not writable");
    return ok(value);
  }

  related(): OptionSome<StateBoolRelated> {
    return some(this);
  }
}

export const BOOL = {
  /**Boolean helper*/
  help<I extends Init<boolean>>(
    init: I,
    options: StateBoolHelperOptions,
  ): [I, StateBoolHelper] {
    return [init, new StateBoolHelper(options)];
  },
};
