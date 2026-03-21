import {
  OptionNone,
  type Option,
  type Result,
  type ResultOk,
} from "@chocbite/ts-lib-result";

/**Function used to subscribe to state changes
 * @template RT - The type of the state’s value when read.*/
export type StateSub<RRT extends Result<any, string>> = (value: RRT) => void;

export type StateInferResult<S extends State<any>> =
  S extends StateROA<infer RT>
    ? ResultOk<RT>
    : S extends StateREA<infer RT>
      ? Result<RT, string>
      : never;

export type StateInferType<S extends State<any>> =
  S extends State<infer RT> ? RT : never;

export type StateInferSub<S extends State<any>> = StateSub<StateInferResult<S>>;

/**Map of values or states related to a state */
export type StateRelated = {};

export type StateSetREXW<RT, S, WT = RT> = (
  value: WT,
  state: S,
  old?: Result<RT, string>,
) => Promise<Result<void, string>>;

export type StateSetROXW<RT, S, WT = RT> = (
  value: WT,
  state: S,
  old?: ResultOk<RT>,
) => Promise<Result<void, string>>;

export type StateSetREXWS<RT, S, WT = RT> = (
  value: WT,
  state: S,
  old?: Result<RT, string>,
) => Result<void, string>;

export type StateSetROXWS<RT, S, WT = RT> = (
  value: WT,
  state: S,
  old?: ResultOk<RT>,
) => Result<void, string>;

//###########################################################################################################################################################
//###########################################################################################################################################################
//      _____  ______          _____  ______ _____     _____ ____  _   _ _______ ________   _________
//     |  __ \|  ____|   /\   |  __ \|  ____|  __ \   / ____/ __ \| \ | |__   __|  ____\ \ / /__   __|
//     | |__) | |__     /  \  | |  | | |__  | |__) | | |   | |  | |  \| |  | |  | |__   \ V /   | |
//     |  _  /|  __|   / /\ \ | |  | |  __| |  _  /  | |   | |  | | . ` |  | |  |  __|   > <    | |
//     | | \ \| |____ / ____ \| |__| | |____| | \ \  | |___| |__| | |\  |  | |  | |____ / . \   | |
//     |_|  \_\______/_/    \_\_____/|______|_|  \_\  \_____\____/|_| \_|  |_|  |______/_/ \_\  |_|

export const STATE_KEY = Symbol("is_state");

export interface StateBase<
  RT,
  WT,
  REL extends Option<StateRelated>,
  RRT extends Result<RT, string>,
> {
  [STATE_KEY]: true;

  //#Reader Context

  /**Allows getting value of the state*/
  then<T = RRT>(func: (value: RRT) => T | PromiseLike<T>): PromiseLike<T>;

  /**Is state guarenteed sync*/
  readonly rsync: boolean;
  /**Gets the current value of the state if state is sync*/
  get?(): RRT;

  /**Is state guarenteed OK*/
  readonly rok: boolean;
  /**Gets the value of the state without result, only works when state is OK */
  ok?(): RT;

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
  write?(value: WT): Promise<Result<void, string>>;
  /**Limits given value to valid range if possible returns None if not possible */
  limit?(value: WT): Promise<Result<WT, string>>;
  /**Checks if the value is valid and returns reason for invalidity */
  check?(value: WT): Promise<Result<WT, string>>;
}

interface REA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: false;
}

interface ROA<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: false;
}

interface RES<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  RT,
  WT,
  REL,
  Result<RT, string>
> {
  readonly rsync: true;
  get(): Result<RT, string>;
  readonly rok: false;
  readonly writable: false;
}

interface ROS<RT, REL extends Option<StateRelated>, WT> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: true;
  get(): ResultOk<RT>;
  readonly rok: true;
  ok(): RT;
  readonly writable: false;
}

interface REAW<RT, WT, REL extends Option<StateRelated>> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: false;
  readonly rok: false;
  readonly writable: true;
  write(value: WT): Promise<Result<void, string>>;
  limit(value: WT): Promise<Result<WT, string>>;
  check(value: WT): Promise<Result<WT, string>>;
}

interface ROAW<RT, WT, REL extends Option<StateRelated>> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: false;
  readonly rok: true;
  readonly writable: true;
  write(value: WT): Promise<Result<void, string>>;
  limit(value: WT): Promise<Result<WT, string>>;
  check(value: WT): Promise<Result<WT, string>>;
}

interface RESW<RT, WT, REL extends Option<StateRelated>> extends StateBase<
  RT,
  WT,
  REL,
  Result<RT, string>
> {
  readonly rsync: true;
  get(): Result<RT, string>;
  readonly rok: false;
  readonly writable: true;
  write(value: WT): Promise<Result<void, string>>;
  limit(value: WT): Promise<Result<WT, string>>;
  check(value: WT): Promise<Result<WT, string>>;
}

interface ROSW<RT, WT, REL extends Option<StateRelated>> extends StateBase<
  RT,
  WT,
  REL,
  ResultOk<RT>
> {
  readonly rsync: true;
  get(): ResultOk<RT>;
  readonly rok: true;
  ok(): RT;
  readonly writable: true;
  write(value: WT): Promise<Result<void, string>>;
  limit(value: WT): Promise<Result<WT, string>>;
  check(value: WT): Promise<Result<WT, string>>;
}

//###########################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/

export type State<RT, WT = RT, REL extends Option<StateRelated> = Option<{}>> =
  | StateREA<RT, REL, WT>
  | StateROA<RT, REL, WT>
  | StateRES<RT, REL, WT>
  | StateROS<RT, REL, WT>
  | StateREAW<RT, WT, REL>
  | StateROAW<RT, WT, REL>
  | StateRESW<RT, WT, REL>
  | StateROSW<RT, WT, REL>;

export type StateREA<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = any,
> =
  | REA<RT, REL, WT>
  | StateREAW<RT, WT, REL>
  | StateROA<RT, REL, WT>
  | StateROS<RT, REL, WT>
  | StateRES<RT, REL, WT>;

export type StateROA<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = any,
> = ROA<RT, REL, WT> | StateROAW<RT, WT, REL> | StateROS<RT, REL, WT>;

export type StateRES<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = any,
> = RES<RT, REL, WT> | StateRESW<RT, WT, REL> | StateROS<RT, REL, WT>;

export type StateROS<
  RT,
  REL extends Option<StateRelated> = Option<{}>,
  WT = any,
> = ROS<RT, REL, WT> | StateROSW<RT, WT, REL>;

export type StateREAW<
  RT,
  WT = RT,
  REL extends Option<StateRelated> = Option<{}>,
> =
  | REAW<RT, WT, REL>
  | StateROAW<RT, WT, REL>
  | StateROSW<RT, WT, REL>
  | StateRESW<RT, WT, REL>;

export type StateROAW<
  RT,
  WT = RT,
  REL extends Option<StateRelated> = Option<{}>,
> = ROAW<RT, WT, REL> | StateROSW<RT, WT, REL>;

export type StateRESW<
  RT,
  WT = RT,
  REL extends Option<StateRelated> = Option<{}>,
> = RESW<RT, WT, REL> | StateROSW<RT, WT, REL>;

export type StateROSW<
  RT,
  WT = RT,
  REL extends Option<StateRelated> = Option<{}>,
> = ROSW<RT, WT, REL>;

export type StateOpt<REL> = REL extends OptionNone ? Option<{}> : REL;

//               _____  _____        __     __
//         /\   |  __ \|  __ \     /\\ \   / /
//        /  \  | |__) | |__) |   /  \\ \_/ /
//       / /\ \ |  _  /|  _  /   / /\ \\   /
//      / ____ \| | \ \| | \ \  / ____ \| |
//     /_/    \_\_|  \_\_|  \_\/_/    \_\_|

export const STATE_ARRAY_READ_KEY = Symbol("state_array_read_key");

export type StateArrayRead<TYPE> = TYPE[] & {
  [STATE_ARRAY_READ_KEY]:
    | {
        type: "added";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "removed";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "changed";
        index: number;
        items: readonly TYPE[];
      }
    | {
        type: "fresh";
      };
};
export const STATE_ARRAY_WRITE_KEY = Symbol("state_array_write_key");

export type StateArrayWrite<TYPE> = TYPE[] & {
  [STATE_ARRAY_WRITE_KEY]:
    | {
        type: "write";
        items: readonly TYPE[];
      }
    | {
        type: "change";
        index: number;
        item: TYPE;
      }
    | {
        type: "push";
        items: readonly TYPE[];
      }
    | {
        type: "unshift";
        items: readonly TYPE[];
      }
    | { type: "pop" }
    | { type: "shift" }
    | {
        type: "delete";
        item: TYPE;
      }
    | {
        type: "splice";
        index: number;
        deletedCount: number;
        items?: readonly TYPE[];
      };
};

//       ____  ____       _ ______ _____ _______
//      / __ \|  _ \     | |  ____/ ____|__   __|
//     | |  | | |_) |    | | |__ | |       | |
//     | |  | |  _ < _   | |  __|| |       | |
//     | |__| | |_) | |__| | |___| |____   | |
//      \____/|____/ \____/|______\_____|  |_|

export const STATE_OBJECT_READ_KEY = Symbol("state_object_read_key");

export type StateObjectRead<TYPE> = {
  [key: PropertyKey]: TYPE;
} & {
  [STATE_OBJECT_READ_KEY]:
    | {
        type: "added";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "removed";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "changed";
        index: number;
        items: Readonly<{ [key: PropertyKey]: TYPE }>;
      }
    | {
        type: "fresh";
      };
};
export const STATE_OBJECT_WRITE_KEY = Symbol("state_object_write_key");

export type StateObjectWrite<TYPE> = {
  [key: PropertyKey]: TYPE;
} & {
  [STATE_OBJECT_WRITE_KEY]:
    | {
        type: "add";
        items: { [key: PropertyKey]: TYPE };
      }
    | {
        type: "remove";
        items: readonly PropertyKey[];
      }
    | {
        type: "change";
        items: { [key: PropertyKey]: TYPE };
      };
};
