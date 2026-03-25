import { number_step_start_decimal } from "@chocbite/ts-lib-math";
import {
  err,
  ok,
  OptionSome,
  Result,
  ResultOk,
  some,
} from "@chocbite/ts-lib-result";
import { StateHelperBase, StateRelatedBase } from "../base";
import {
  COLLECTED,
  StateCollectedREA,
  StateCollectedRES,
  StateCollectedROA,
  StateCollectedROS,
} from "../collected";
import { State, StateRES, StateROA, StateROS } from "../types";

//##################################################################################################################################################
//      _    _ ______ _      _____  ______ _____
//     | |  | |  ____| |    |  __ \|  ____|  __ \
//     | |__| | |__  | |    | |__) | |__  | |__) |
//     |  __  |  __| | |    |  ___/|  __| |  _  /
//     | |  | | |____| |____| |    | |____| | \ \
//     |_|  |_|______|______|_|    |______|_|  \_\

export interface StateNumberRelated extends StateRelatedBase {
  min?: State<number>;
  max?: State<number>;
  unit?: State<string>;
  decimals?: State<number>;
  step?: State<number>;
  start?: State<number>;
}

export class StateNumberHelper
  extends StateHelperBase<number, number, OptionSome<StateNumberRelated>>
  implements StateNumberRelated
{
  readonly min?: State<number>;
  readonly max?: State<number>;
  readonly unit?: State<string>;
  readonly decimals?: State<number>;
  readonly step?: State<number>;
  readonly start?: State<number>;

  constructor(
    min?: State<number>,
    max?: State<number>,
    unit?: State<string>,
    decimals?: State<number>,
    step?: State<number>,
    start?: State<number>,
    writable?: State<boolean>,
  ) {
    super(writable);
    if (min) this.min = min;
    if (max) this.max = max;
    if (unit) this.unit = unit;
    if (step) this.step = step;
    if (start) this.start = start;
    if (decimals) this.decimals = decimals;
  }

  async limit(value: number): Promise<Result<number, string>> {
    const [min, max, step, start, decimals] = await Promise.all([
      this.min,
      this.max,
      this.step,
      this.start,
      this.decimals,
    ]);
    return ok(
      Math.min(
        max?.unwrap_or(Infinity) ?? Infinity,
        Math.max(
          min?.unwrap_or(-Infinity) ?? -Infinity,
          number_step_start_decimal(
            value,
            step?.unwrap_or(undefined),
            start?.unwrap_or(undefined),
            decimals?.unwrap_or(undefined),
          ),
        ),
      ),
    );
  }

  async check(value: number): Promise<Result<number, string>> {
    const [min, max] = await Promise.all([this.min, this.max]);
    if (max?.ok && value > max.value)
      return err(value + " is bigger than the limit of " + max.value);
    if (min?.ok && value < min.value)
      return err(value + " is smaller than the limit of " + min.value);
    return ok(value);
  }

  related(): OptionSome<StateNumberRelated> {
    return some(this);
  }
}

//##################################################################################################################################################
//       _____ ____  _      _      ______ _____ _______ ______ _____
//      / ____/ __ \| |    | |    |  ____/ ____|__   __|  ____|  __ \
//     | |   | |  | | |    | |    | |__ | |       | |  | |__  | |  | |
//     | |   | |  | | |    | |    |  __|| |       | |  |  __| | |  | |
//     | |___| |__| | |____| |____| |___| |____   | |  | |____| |__| |
//      \_____\____/|______|______|______\_____|  |_|  |______|_____/

//##################################################################################################################################################
//       _____ _    _ __  __
//      / ____| |  | |  \/  |
//     | (___ | |  | | \  / |
//      \___ \| |  | | |\/| |
//      ____) | |__| | |  | |
//     |_____/ \____/|_|  |_|
class NumberSumREA<S extends State<number>[]> extends COLLECTED.class<
  number,
  S,
  number,
  Result<number, string>
> {
  constructor(...states: S) {
    super(false, false, false, ...states);
  }
  protected getter(values: Result<number, string>[]): Result<number, string> {
    let sum = 0;
    for (const val of values) {
      if (val.err) return val;
      sum += val.value;
    }
    return ok(sum);
  }
}

//##################################################################################################################################################
class NumberSumROA<
  S extends [StateROA<number>, ...StateROA<number>[]],
> extends COLLECTED.class<number, S, number, ResultOk<number>> {
  constructor(...states: S) {
    super(true, false, false, ...states);
  }
  protected getter(values: ResultOk<number>[]): ResultOk<number> {
    return ok(values.reduce((acc, val) => acc + val.value, 0));
  }
}

//##################################################################################################################################################
class NumberSumRES<S extends StateRES<number>[]> extends COLLECTED.class<
  number,
  S,
  number,
  Result<number, string>
> {
  constructor(...states: S) {
    super(false, true, false, ...states);
  }
  protected getter(values: Result<number, string>[]): Result<number, string> {
    let sum = 0;
    for (const val of values) {
      if (val.err) return val;
      sum += val.value;
    }
    return ok(sum);
  }
}

//##################################################################################################################################################
class NumberSumROS<
  S extends [StateROS<number>, ...StateROS<number>[]],
> extends COLLECTED.class<number, S, number, ResultOk<number>> {
  constructor(...states: S) {
    super(true, true, false, ...states);
  }
  protected getter(values: ResultOk<number>[]): ResultOk<number> {
    return ok(values.reduce((acc, val) => acc + val.value, 0));
  }
}

//##################################################################################################################################################
//      _____  ______ _____   _____ ______ _   _ _______       _____ ______
//     |  __ \|  ____|  __ \ / ____|  ____| \ | |__   __|/\   / ____|  ____|
//     | |__) | |__  | |__) | |    | |__  |  \| |  | |  /  \ | |  __| |__
//     |  ___/|  __| |  _  /| |    |  __| | . ` |  | | / /\ \| | |_ |  __|
//     | |    | |____| | \ \| |____| |____| |\  |  | |/ ____ \ |__| | |____
//     |_|    |______|_|  \_\\_____|______|_| \_|  |_/_/    \_\_____|______|

class NumberPercentageREA<
  S extends State<number>,
  T extends State<number>,
> extends COLLECTED.class<number, [S, T], number, Result<number, string>> {
  constructor(st1: S, st2: T) {
    super(false, false, false, st1, st2);
  }
  protected getter(
    values: [Result<number, string>, Result<number, string>],
  ): Result<number, string> {
    if (values[0].err) return values[0];
    if (values[1].err) return values[1];
    return ok(
      (values[1].value / (values[0].value === 0 ? 1 : values[0].value)) * 100,
    );
  }
}

//##################################################################################################################################################
class NumberPercentageROA<
  S extends StateROA<number>,
  T extends StateROA<number>,
> extends COLLECTED.class<number, [S, T], number, ResultOk<number>> {
  constructor(st1: S, st2: T) {
    super(true, false, false, st1, st2);
  }
  protected getter(
    values: [ResultOk<number>, ResultOk<number>],
  ): ResultOk<number> {
    return ok(
      (values[1].value / (values[0].value === 0 ? 1 : values[0].value)) * 100,
    );
  }
}

//##################################################################################################################################################
class NumberPercentageRES<
  S extends StateRES<number>,
  T extends StateRES<number>,
> extends COLLECTED.class<number, [S, T], number, Result<number, string>> {
  constructor(st1: S, st2: T) {
    super(false, true, false, st1, st2);
  }
  protected getter(
    values: [Result<number, string>, Result<number, string>],
  ): Result<number, string> {
    if (values[0].err) return values[0];
    if (values[1].err) return values[1];
    return ok(
      (values[1].value / (values[0].value === 0 ? 1 : values[0].value)) * 100,
    );
  }
}

//##################################################################################################################################################
class NumberPercentageROS<
  S extends StateROS<number>,
  T extends StateROS<number>,
> extends COLLECTED.class<number, [S, T], number, ResultOk<number>> {
  constructor(st1: S, st2: T) {
    super(true, true, false, st1, st2);
  }
  protected getter(
    values: [ResultOk<number>, ResultOk<number>],
  ): ResultOk<number> {
    return ok(
      (values[1].value / (values[0].value === 0 ? 1 : values[0].value)) * 100,
    );
  }
}

export const COLLECTS_NUMBER = {
  //Calculates the sum of all the states
  sum: {
    rea<S extends State<number>[]>(...states: S) {
      return new NumberSumREA(...states) as StateCollectedREA<number, S>;
    },
    roa<S extends [StateROA<number>, ...StateROA<number>[]]>(...states: S) {
      return new NumberSumROA(...states) as StateCollectedROA<number, S>;
    },
    res<S extends StateRES<number>[]>(...states: S) {
      return new NumberSumRES(...states) as StateCollectedRES<number, S>;
    },
    ros<S extends [StateROS<number>, ...StateROS<number>[]]>(...states: S) {
      return new NumberSumROS(...states) as StateCollectedROS<number, S>;
    },
  },
  //Calculates how many percent the second state is of the first state
  percentage: {
    rea<S extends State<number>, T extends State<number>>(st1: S, st2: T) {
      return new NumberPercentageREA(st1, st2) as StateCollectedREA<
        number,
        [S, T]
      >;
    },
    roa<S extends StateROA<number>, T extends StateROA<number>>(
      st1: S,
      st2: T,
    ) {
      return new NumberPercentageROA(st1, st2) as StateCollectedROA<
        number,
        [S, T]
      >;
    },
    res<S extends StateRES<number>, T extends StateRES<number>>(
      st1: S,
      st2: T,
    ) {
      return new NumberPercentageRES(st1, st2) as StateCollectedRES<
        number,
        [S, T]
      >;
    },
    ros<S extends StateROS<number>, T extends StateROS<number>>(
      st1: S,
      st2: T,
    ) {
      return new NumberPercentageROS(st1, st2) as StateCollectedROS<
        number,
        [S, T]
      >;
    },
  },
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

export const NUMBER = {
  /**Number limiter struct
   * @param min minimum allowed number
   * @param max maximum allowed number
   * @param unit unit for number
   * @param decimals number of suggested decimals to show
   * @param step allowed step size for number 0.1 allows 0,0.1,0.2,0.3...
   * @param start start offset for step, 0.5 and step 2 allows 0.5,2.5,4.5,6.5*/
  helper(
    min?: State<number>,
    max?: State<number>,
    unit?: State<string>,
    decimals?: State<number>,
    step?: State<number>,
    start?: State<number>,
    writable?: State<boolean>,
  ) {
    return new StateNumberHelper(
      min,
      max,
      unit,
      decimals,
      step,
      start,
      writable,
    );
  },
};
