import { err, ok, OptionSome, Result, some } from "@chocbite/ts-lib-result";
import { StateHelperBase, StateRelatedBase } from "../base";
import { State } from "../types";

export interface StateStringRelated extends StateRelatedBase {
  max_length?: State<number>;
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
  constructor(
    max_length?: State<number>,
    max_length_bytes?: State<number>,
    writable?: State<boolean>,
  ) {
    super(writable);
    if (max_length) this.max_length = max_length;
    if (max_length_bytes) this.max_length_bytes = max_length_bytes;
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
  /**String limiter struct
   * @param max_length max length for string
   * @param max_length_bytes max byte length for string*/
  helper(
    max_length?: State<number>,
    max_length_bytes?: State<number>,
    writable?: State<boolean>,
  ) {
    return new StateStringHelper(max_length, max_length_bytes, writable);
  },
};
