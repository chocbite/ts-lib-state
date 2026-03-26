import { err, ok, OptionSome, Result, some } from "@chocbite/ts-lib-result";
import { State } from "../types";
import {
  StateInit as Init,
  StateHelperBase,
  StateHelperBaseOptions,
  StateRelatedBase,
} from "./helpers";

export interface StateStringRelated extends StateRelatedBase {
  max_length?: State<number>;
  max_length_bytes?: State<number>;
}

export interface StateStringHelperOptions extends StateHelperBaseOptions {
  /**max length for string */
  max_length?: State<number>;
  /**max byte length for string */
  max_length_bytes?: State<number>;
}

export class StateStringHelper
  extends StateHelperBase<
    Result<string, string>,
    string,
    OptionSome<StateStringRelated>
  >
  implements StateStringRelated
{
  max_length?: State<number>;
  max_length_bytes?: State<number>;
  constructor(options: StateStringHelperOptions) {
    super(options);
    if (options.max_length) this.max_length = options.max_length;
    if (options.max_length_bytes)
      this.max_length_bytes = options.max_length_bytes;
  }

  async limit(value: string): Promise<Result<string, string>> {
    const [max_length, max_length_bytes] = await Promise.all([
      this.max_length,
      this.max_length_bytes,
    ]);
    if (max_length?.ok && value.length > max_length.value)
      value = value.slice(0, max_length.value);
    if (max_length_bytes?.ok) {
      value = new TextDecoder().decode(
        new TextEncoder().encode(value).slice(0, max_length_bytes.value),
      );
      if (value.at(-1)?.charCodeAt(0) === 65533) value = value.slice(0, -1);
    }
    return ok(value);
  }
  async check(value: string): Promise<Result<string, string>> {
    const [max_length, max_length_bytes] = await Promise.all([
      this.max_length,
      this.max_length_bytes,
    ]);
    if (max_length?.ok && value.length > max_length.value)
      return err(
        "the text is longer than the limit of " +
          max_length.value +
          " characters",
      );
    if (
      max_length_bytes?.ok &&
      new TextEncoder().encode(value).length > max_length_bytes.value
    )
      return err(
        "the text is longer than the limit of " +
          max_length_bytes.value +
          " bytes",
      );
    return ok(value);
  }
  related(): OptionSome<StateStringRelated> {
    return some(this);
  }
}

export const STRING = {
  /**String helper*/
  help<I extends Init<string>>(
    init: I,
    options: StateStringHelperOptions,
  ): [I, StateStringHelper] {
    return [init, new StateStringHelper(options)];
  },
};
