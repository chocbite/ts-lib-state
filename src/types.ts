import {
  ResultInferOk,
  type Option,
  type Result,
  type ResultOk,
} from "@chocbite/ts-lib-result";
import type { StateArrayRead, StateArrayWrite } from "./helpers/array";
import type { StateObjectRead, StateObjectWrite } from "./helpers/object";

export type StateResult<T> = Result<T, string>;

/**Automatically maps array types to StateArrayRead and object record types to StateObjectRead when reading state values.
 * For primitive types and non-record objects, returns the type unchanged.*/
export type AutoRead<RT> =
  0 extends 1 & RT
    ? RT
    : RT extends readonly (infer E)[]
      ? StateArrayRead<E>
      : string extends keyof RT
        ? StateObjectRead<RT[string & keyof RT]>
        : RT;

/**Automatically maps array types to StateArrayWrite and object record types to StateObjectWrite when writing state values.
 * For primitive types and non-record objects, returns the type unchanged.*/
export type AutoWrite<RT> =
  0 extends 1 & RT
    ? RT
    : RT extends readonly (infer E)[]
      ? StateArrayWrite<E>
      : string extends keyof RT
        ? StateObjectWrite<RT[string & keyof RT]>
        : RT;

/**Function used to subscribe to state changes
 * @template RT - The type of the state’s value when read.*/
export type StateSub<RRT extends StateResult<any>> = (value: RRT) => void;

export type StateInferResult<S extends State<any>> =
  S extends StateROA<infer RT>
    ? ResultOk<AutoRead<RT>>
    : S extends StateREA<infer RT>
      ? StateResult<AutoRead<RT>>
      : never;

export type StateInferType<S extends State<any>> =
  S extends State<infer RT> ? AutoRead<RT> : never;

export type StateInferSub<S extends State<any>> = StateSub<StateInferResult<S>>;

export interface StateRelated {}

/**Map of values or states related to a state */
export interface StateHelper<_RRT, WT, REL extends StateRelated> {
  /**Returns data related to the state */
  related(): REL;
  /**Limits given value to valid range if possible or error reason if not possible */
  limit(value: WT): PromiseLike<StateResult<WT>>;
  /**Checks if the value is valid and returns reason for invalidity */
  check(value: WT): PromiseLike<StateResult<WT>>;
}

export type HelperRelated<HEL extends StateHelper<any, any, any>> = ReturnType<
  HEL["related"]
>;

//###########################################################################################################################################################
//###########################################################################################################################################################
//      _____  ______          _____  ______ _____     _____ ____  _   _ _______ ________   _________
//     |  __ \|  ____|   /\   |  __ \|  ____|  __ \   / ____/ __ \| \ | |__   __|  ____\ \ / /__   __|
//     | |__) | |__     /  \  | |  | | |__  | |__) | | |   | |  | |  \| |  | |  | |__   \ V /   | |
//     |  _  /|  __|   / /\ \ | |  | |  __| |  _  /  | |   | |  | | . ` |  | |  |  __|   > <    | |
//     | | \ \| |____ / ____ \| |__| | |____| | \ \  | |___| |__| | |\  |  | |  | |____ / . \   | |
//     |_|  \_\______/_/    \_\_____/|______|_|  \_\  \_____\____/|_| \_|  |_|  |______/_/ \_\  |_|

export const STATE_KEY = Symbol("state");

export interface StateBase<
  RRT extends StateResult<any>,
  REL extends Option<StateRelated>,
  WT,
> {
  [STATE_KEY]: true;

  //#Reader Context

  /**Allows getting value of the state*/
  then<TResult1 = RRT, TResult2 = never>(
    on_fulfilled?: ((value: RRT) => TResult1 | PromiseLike<TResult1>) | null,
    on_rejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;

  /**Is state guarenteed sync*/
  readonly rsync: boolean;
  /**Gets the current value of the state if state is sync*/
  get?(): RRT;

  /**Is state guarenteed OK*/
  readonly rok: boolean;
  /**Gets the value of the state without result, only works when state is OK */
  ok?(): ResultInferOk<RRT>;

  /**This adds a function as a subscriber to changes to the state
   * @param update set true to update subscriber immediatly*/
  sub<T = StateSub<RRT>>(func: StateSub<RRT>, update?: boolean): T;
  /**This removes a function as a subscriber to the state*/
  unsub<T = StateSub<RRT>>(func: T): T;

  /**This returns related states if any*/
  related(): REL;

  /**Returns if the state is being used */
  in_use(): this | undefined;
  /**Returns if the state has a subscriber */
  has(subscriber: StateSub<RRT>): this | undefined;
  /**Returns the amount of subscribers the state has */
  amount(): number;

  //#Writer Context
  /**Is state guarenteed writable*/
  readonly writable: boolean;
  /** This attempts a write to the state, write is not guaranteed to succeed
   * @returns promise of result with error for the write*/
  write?(value: WT): PromiseLike<StateResult<void>>;
  /**Limits given value to valid range if possible returns None if not possible */
  limit?(value: WT): PromiseLike<StateResult<WT>>;
  /**Checks if the value is valid and returns reason for invalidity */
  check?(value: WT): PromiseLike<StateResult<WT>>;
}

interface REA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: false;
}

interface ROA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: false;
}

interface RES<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  StateResult<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): StateResult<AutoRead<RT>>;
  readonly rok: false;
  readonly writable: false;
}

interface ROS<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): ResultOk<AutoRead<RT>>;
  readonly rok: true;
  ok(): AutoRead<RT>;
  readonly writable: false;
}

interface REAW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: true;
  write(value: WT): PromiseLike<StateResult<void>>;
  limit(value: WT): PromiseLike<StateResult<WT>>;
  check(value: WT): PromiseLike<StateResult<WT>>;
}

interface ROAW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: true;
  write(value: WT): PromiseLike<StateResult<void>>;
  limit(value: WT): PromiseLike<StateResult<WT>>;
  check(value: WT): PromiseLike<StateResult<WT>>;
}

interface RESW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  StateResult<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): StateResult<AutoRead<RT>>;
  readonly rok: false;
  readonly writable: true;
  write(value: WT): PromiseLike<StateResult<void>>;
  limit(value: WT): PromiseLike<StateResult<WT>>;
  check(value: WT): PromiseLike<StateResult<WT>>;
}

interface ROSW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<AutoRead<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): ResultOk<AutoRead<RT>>;
  readonly rok: true;
  ok(): AutoRead<RT>;
  readonly writable: true;
  write(value: WT): PromiseLike<StateResult<void>>;
  limit(value: WT): PromiseLike<StateResult<WT>>;
  check(value: WT): PromiseLike<StateResult<WT>>;
}

//###########################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

export type State<RT, REL extends Option<StateRelated> = Option<{}>, WT = AutoWrite<RT>> =
  | StateREA<RT, REL, WT>
  | StateROA<RT, REL, WT>
  | StateRES<RT, REL, WT>
  | StateROS<RT, REL, WT>
  | StateREAW<RT, REL, WT>
  | StateROAW<RT, REL, WT>
  | StateRESW<RT, REL, WT>
  | StateROSW<RT, REL, WT>;

export type StateREA<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> =
  | REA<RT, REL, WT>
  | StateREAW<RT, REL, WT>
  | StateROA<RT, REL, WT>
  | StateROS<RT, REL, WT>
  | StateRES<RT, REL, WT>;

export type StateROA<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = ROA<RT, REL, WT> | StateROAW<RT, REL, WT> | StateROS<RT, REL, WT>;

export type StateRES<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = RES<RT, REL, WT> | StateRESW<RT, REL, WT> | StateROS<RT, REL, WT>;

export type StateROS<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = ROS<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateREAW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> =
  | REAW<RT, REL, WT>
  | StateROAW<RT, REL, WT>
  | StateROSW<RT, REL, WT>
  | StateRESW<RT, REL, WT>;

export type StateROAW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = ROAW<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateRESW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = RESW<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateROSW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = AutoWrite<RT>,
> = ROSW<RT, REL, WT>;


