import { err, ok, OptionSome, Result, some } from "@chocbite/ts-lib-result";
import { SVGFunc } from "@chocbite/ts-lib-svg";
import { StateHelperBase, StateRelatedBase } from "../base";
import { State } from "../types";

type EnumHelperEntry = {
  name: string;
  description?: string;
  icon?: SVGFunc;
};

type StateEnumHelperList<K extends PropertyKey> = {
  [P in K]: EnumHelperEntry;
};

export interface StateEnumRelated<
  L extends StateEnumHelperList<PropertyKey> = StateEnumHelperList<PropertyKey>,
> extends StateRelatedBase {
  list: State<L>;
}

export class StateEnumHelper<
  L extends StateEnumHelperList<PropertyKey> = StateEnumHelperList<PropertyKey>,
  K extends PropertyKey = keyof L,
  R extends StateRelatedBase = StateEnumRelated<L>,
>
  extends StateHelperBase<Result<K, string>, K, OptionSome<R>>
  implements StateEnumRelated<L>
{
  readonly list: State<L>;

  constructor(list: State<L>, writable?: State<boolean>) {
    super(writable);
    this.list = list;
  }

  async limit(value: K): Promise<Result<K, string>> {
    return ok(value);
  }

  async check(value: K): Promise<Result<K, string>> {
    const list = await this.list;
    if (list.err) return err("list is not available");
    if (value in list.value) return ok(value);
    return err(String(value) + " is not in list");
  }

  related(): OptionSome<R> {
    return some(this as unknown as R);
  }
}

export const ENUM = {
  /**Creates an enum helper struct, use list method to make a list with correct typing*/
  helper<
    L extends StateEnumHelperList<PropertyKey>,
    K extends PropertyKey = keyof L,
    R extends StateRelatedBase = StateEnumRelated<L>,
  >(list: State<L>, writable?: State<boolean>) {
    return new StateEnumHelper<L, K, R>(list, writable);
  },
  /**Creates an enum description list, passing the enum as a generic type to this function makes things look a bit nicer */
  list<K extends PropertyKey>(list: StateEnumHelperList<K>): typeof list {
    return list;
  },
  /**Maps over an enum description list
   * @param list enum description list
   * @param func function to apply to each entry
   * @returns array of results*/
  map<K extends PropertyKey, R>(
    list: StateEnumHelperList<K>,
    func: (key: K, val: EnumHelperEntry) => R,
  ): R[] {
    return Object.keys(list).map((key) => func(key as K, list[key as K]));
  },
};
