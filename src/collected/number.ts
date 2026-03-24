import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import type { State, StateRES, StateROA, StateROS } from "../types";
import {
  COLLECTED,
  StateCollectedREA,
  StateCollectedRES,
  StateCollectedROA,
  type StateCollectedROS,
} from "./collected";

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
