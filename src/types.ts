import {
  ResultInferOk,
  type Option,
  type Result,
  type ResultOk,
} from "@chocbite/ts-lib-result";
import { StateArrayRead, StateArrayWrite } from "./helpers/array";
import { StateObjectRead, StateObjectWrite } from "./helpers/object";

export type StateResult<T> = Result<T, string>;

/**Function used to subscribe to state changes
 * @template RT - The type of the state’s value when read.*/
export type StateSub<RRT extends StateResult<any>> = (value: RRT) => void;

export type StateInferResult<S extends State<any>> =
  S extends StateROA<infer RT>
    ? ResultOk<RT>
    : S extends StateREA<infer RT>
      ? StateResult<RT>
      : never;

export type StateInferType<S extends State<any>> =
  S extends State<infer RT> ? RT : never;

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

export type StateReadType<RT> = RT extends any[]
  ? StateArrayRead<RT[number]>
  : RT extends object
    ? StateObjectRead<RT>
    : RT;

export type StateWriteType<WT> = WT extends any[]
  ? StateArrayWrite<WT[number]>
  : WT extends object
    ? StateObjectWrite<WT>
    : WT;

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
  RRT extends StateResult<StateReadType<any>>,
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
  write?(value: StateWriteType<WT>): PromiseLike<StateResult<void>>;
  /**Limits given value to valid range if possible returns None if not possible */
  limit?(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
  /**Checks if the value is valid and returns reason for invalidity */
  check?(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
}

interface REA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: false;
}

interface ROA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: false;
}

interface RES<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  StateResult<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): StateResult<StateReadType<RT>>;
  readonly rok: false;
  readonly writable: false;
}

interface ROS<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): ResultOk<StateReadType<RT>>;
  readonly rok: true;
  ok(): StateReadType<RT>;
  readonly writable: false;
}

interface REAW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: true;
  write(value: StateWriteType<WT>): PromiseLike<StateResult<void>>;
  limit(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
  check(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
}

interface ROAW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: true;
  write(value: StateWriteType<WT>): PromiseLike<StateResult<void>>;
  limit(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
  check(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
}

interface RESW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  StateResult<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): StateResult<StateReadType<RT>>;
  readonly rok: false;
  readonly writable: true;
  write(value: StateWriteType<WT>): PromiseLike<StateResult<void>>;
  limit(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
  check(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
}

interface ROSW<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  ResultOk<StateReadType<RT>>,
  REL,
  WT
> {
  readonly rsync: true;
  get(): ResultOk<StateReadType<RT>>;
  readonly rok: true;
  ok(): StateReadType<RT>;
  readonly writable: true;
  write(value: StateWriteType<WT>): PromiseLike<StateResult<void>>;
  limit(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
  check(value: StateWriteType<WT>): PromiseLike<StateResult<WT>>;
}

//###########################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

export type State<RT, REL extends Option<StateRelated> = Option<{}>, WT = RT> =
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
  WT = RT,
> =
  | REA<RT, REL, WT>
  | StateREAW<RT, REL, WT>
  | StateROA<RT, REL, WT>
  | StateROS<RT, REL, WT>
  | StateRES<RT, REL, WT>;

export type StateROA<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = ROA<RT, REL, WT> | StateROAW<RT, REL, WT> | StateROS<RT, REL, WT>;

export type StateRES<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = RES<RT, REL, WT> | StateRESW<RT, REL, WT> | StateROS<RT, REL, WT>;

export type StateROS<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = ROS<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateREAW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> =
  | REAW<RT, REL, WT>
  | StateROAW<RT, REL, WT>
  | StateROSW<RT, REL, WT>
  | StateRESW<RT, REL, WT>;

export type StateROAW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = ROAW<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateRESW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = RESW<RT, REL, WT> | StateROSW<RT, REL, WT>;

export type StateROSW<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = RT,
> = ROSW<RT, REL, WT>;

const yo = undefined as unknown as State<{}>;
yo.get!();
