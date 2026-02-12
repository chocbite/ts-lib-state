import type { Result, ResultOk } from "@chocbite/ts-lib-result";
import type {
  State,
  StateInferResult,
  StateREA,
  StateROA,
  StateSub,
} from "../types";

export type StateCollectedTransVal<IN extends State<any>[]> = {
  [I in keyof IN]: StateInferResult<IN[I]>;
};

export type StateCollectedTransValUnk<IN extends State<any>[]> = {
  [I in keyof IN]: IN[I] extends StateROA<infer RT>
    ? ResultOk<RT>
    : IN[I] extends StateREA<infer RT>
      ? Result<RT, string>
      : unknown;
};

export type StateCollectedSubs<IN extends State<any>[]> = {
  [I in keyof IN]: StateSub<StateInferResult<IN[I]>>;
};

export type StateCollectedStates<IN extends State<any>[]> = {
  [I in keyof IN]: IN[I] extends StateROA<infer RT>
    ? StateROA<RT>
    : IN[I] extends StateREA<infer RT>
      ? StateREA<RT>
      : never;
};
