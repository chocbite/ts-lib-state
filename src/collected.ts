import {
  err,
  none,
  OptionNone,
  Result,
  ResultInferOk,
  type ResultOk,
} from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import {
  StateInferResult,
  StateREA,
  StateROA,
  StateSub,
  type State,
  type StateRES,
  type StateROS,
} from "./types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/
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

interface Owner<
  RT,
  IN extends State<any>[],
  WT,
  RRT extends Result<RT, string>,
> {
  /**The `setStates` method is used to update the states used by the `StateDerived` class.
   * @param states - The new states. This function should accept an array of states and return the derived state.*/
  set_states(...states: StateCollectedStates<IN>): void;
  /**The `setGetter` method is used to update the getter function used by the `StateDerived` class.
   * This function is used to compute the derived state based on the current states.
   * @param getter - The new getter function. This function should accept an array of states and return the derived state.*/
  set_getter(getter: (values: StateCollectedTransVal<IN>) => RRT): void;
  get state(): State<RT, any, WT>;
}
export type StateCollectedROS<
  RT,
  IN extends [StateRES<any>, ...StateRES<any>[]],
  WT = any,
> = StateROS<RT, OptionNone, WT> &
  Owner<RT, IN, WT, ResultOk<RT>> & {
    get read_only(): StateROS<RT, any, WT>;
  };

export type StateCollectedROA<
  RT,
  IN extends [State<any>, ...State<any>[]],
  WT = any,
> = StateROA<RT, OptionNone, WT> &
  Owner<RT, IN, WT, ResultOk<RT>> & {
    get read_only(): StateROA<RT, any, WT>;
  };

export type StateCollectedRES<
  RT,
  IN extends StateRES<any>[],
  WT = any,
> = StateRES<RT, OptionNone, WT> &
  Owner<RT, IN, WT, Result<RT, string>> & {
    get read_only(): StateRES<RT, any, WT>;
  };

export type StateCollectedREA<RT, IN extends State<any>[], WT = any> = StateREA<
  RT,
  OptionNone,
  WT
> &
  Owner<RT, IN, WT, Result<RT, string>> & {
    get read_only(): StateREA<RT, any, WT>;
  };

//##################################################################################################################################################
//       _____ _                _____ _____
//      / ____| |        /\    / ____/ ____|
//     | |    | |       /  \  | (___| (___
//     | |    | |      / /\ \  \___ \\___ \
//     | |____| |____ / ____ \ ____) |___) |
//      \_____|______/_/    \_\_____/_____/

export class RXX<
  RT,
  IN extends State<any>[],
  WT,
  RRT extends Result<RT, string>,
>
  extends StateBase<RRT, WT, OptionNone>
  implements Owner<RT, IN, WT, RRT>
{
  constructor(
    rok: boolean,
    rsync: boolean,
    transform: ((values: StateCollectedTransVal<IN>) => RRT) | false,
    ...states: IN
  ) {
    super();
    this.#rok = rok;
    this.#rsync = rsync;
    if (transform) this.getter = transform;
    this.#states = states;
  }

  #rok: boolean;
  #rsync: boolean;
  #buffer?: RRT;
  #states: IN;
  #state_buffers: StateCollectedTransValUnk<IN> =
    [] as StateCollectedTransValUnk<IN>;
  #state_subscribers: StateCollectedSubs<IN>[] = [];

  protected getter(values: StateCollectedTransVal<IN>): RRT {
    return values[0] as RRT;
  }

  /**Called when subscriber is added*/
  protected on_subscribe() {
    if (!this.#states.length) {
      this.#buffer = err("No states registered") as RRT;
      return;
    } else if (this.#rsync) {
      //Correct size of buffer array
      this.#state_buffers.length = this.#states.length;
      this.#buffer = this.getter(
        this.#states.map((s) => s.get!()) as StateCollectedTransVal<IN>,
      );
      this.update_subs(this.#buffer);
      let calc = false;
      for (let i = 0; i < this.#states.length; i++) {
        this.#state_subscribers[i] = this.#states[i].sub((value) => {
          this.#state_buffers[i] = value;
          if (!calc) {
            calc = true;
            Promise.resolve().then(() => {
              this.#buffer = this.getter(
                this.#state_buffers as StateCollectedTransVal<IN>,
              );
              this.update_subs(this.#buffer);
              calc = false;
            });
          }
        });
      }
    } else {
      //Correct size of buffer array
      this.#state_buffers.length = this.#states.length;
      let count = 0;
      const amount = this.#states.length - 1;
      Promise.all(this.#states).then((vals) => {
        for (let i = 0; i < this.#state_buffers.length; i++)
          this.#state_buffers[i] = this.#state_buffers[i] ?? vals[i];
        this.#buffer = this.getter(
          this.#state_buffers as StateCollectedTransVal<IN>,
        );
        this.ful_r_prom(this.#buffer);
        count = amount;
      });
      //Creates a new scope to hold count and amount variables
      {
        let calc = false;
        for (let i = 0; i < this.#states.length; i++) {
          this.#state_subscribers[i] = this.#states[i].sub((value) => {
            if (count < amount) {
              if (!this.#state_buffers[i]) count++;
              this.#state_buffers[i] = value;
              return;
            }
            this.#state_buffers[i] = value;
            if (!calc) {
              calc = true;
              Promise.resolve().then(() => {
                this.#buffer = this.getter(
                  this.#state_buffers as StateCollectedTransVal<IN>,
                );
                this.update_subs(this.#buffer);
                calc = false;
              });
            }
          });
        }
      }
    }
  }

  /**Called when subscriber is removed*/
  protected on_unsubscribe() {
    for (let i = 0; i < this.#states.length; i++)
      this.#states[i].unsub(this.#state_subscribers[i] as any);
    this.#state_subscribers = [];
    this.#state_buffers = [] as StateCollectedTransVal<IN>;
    this.#buffer = undefined;
  }

  //#Owner
  set_states(...states: StateCollectedStates<IN>) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.#states = [...states] as unknown as IN;
      this.on_subscribe();
    } else this.#states = [...states] as unknown as IN;
  }
  set_getter(getter: (values: StateCollectedTransVal<IN>) => RRT) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.getter = getter;
      this.on_subscribe();
    } else this.getter = getter;
  }
  get state() {
    return this as State<RT, any, WT>;
  }
  get read_only() {
    return this as StateROS<RT, any, WT>;
  }

  //#Reader Context
  get rok(): boolean {
    return this.#rok;
  }
  get rsync(): boolean {
    return this.#rsync;
  }
  then<T = RRT>(func: (value: RRT) => T | PromiseLike<T>): Promise<T> {
    try {
      if (this.#buffer) return Promise.resolve(func(this.#buffer));
      if (this.#rsync) return Promise.resolve(func(this.get()));
      if (!this.#state_buffers.length) {
        return Promise.resolve(
          Promise.all(this.#states).then((v) =>
            func(this.getter(v as StateCollectedTransVal<IN>)),
          ),
        );
      }
      return this.append_r_prom(func);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
  get(): RRT {
    if (this.#buffer) return this.#buffer;
    return this.getter(
      this.#states.map((s) => s.get!()) as StateCollectedTransVal<IN>,
    );
  }
  ok(): ResultInferOk<RRT> {
    return (this.get() as ResultOk<ResultInferOk<RRT>>).value;
  }
  related(): OptionNone {
    return none();
  }

  //#Writer Context
  get writable(): false {
    return false;
  }
  limit(_value: WT): Promise<Result<WT, string>> {
    return Promise.resolve(err("not writable"));
  }
  check(_value: WT): Promise<Result<WT, string>> {
    return Promise.resolve(err("not writable"));
  }
}

export const COLLECTED = {
  /**Creates a guarenteed ok state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  ros<RT, IN extends [StateRES<any>, ...StateRES<any>[]], WT = any>(
    transform: ((values: StateCollectedTransVal<IN>) => ResultOk<RT>) | false,
    ...states: IN
  ) {
    return new RXX<RT, IN, WT, ResultOk<RT>>(
      true,
      true,
      transform,
      ...states,
    ) as StateCollectedROS<RT, IN, WT>;
  },
  /**Creates a guarenteed ok state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  roa<RT, IN extends [State<any>, ...State<any>[]], WT = any>(
    transform: ((values: StateCollectedTransVal<IN>) => ResultOk<RT>) | false,
    ...states: IN
  ) {
    return new RXX<RT, IN, WT, ResultOk<RT>>(
      true,
      false,
      transform,
      ...states,
    ) as StateCollectedROA<RT, IN, WT>;
  },
  /**Creates a state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  res<RT, IN extends StateRES<any>[], WT = any>(
    transform:
      | ((values: StateCollectedTransVal<IN>) => Result<RT, string>)
      | false,
    ...states: IN
  ) {
    return new RXX<RT, IN, WT, Result<RT, string>>(
      false,
      true,
      transform,
      ...states,
    ) as StateCollectedRES<RT, IN, WT>;
  },
  /**Creates a state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  rea<RT, IN extends State<any>[], WT = any>(
    transform:
      | ((values: StateCollectedTransVal<IN>) => Result<RT, string>)
      | false,
    ...states: IN
  ) {
    return new RXX<RT, IN, WT, Result<RT, string>>(
      false,
      false,
      transform,
      ...states,
    ) as StateCollectedREA<RT, IN, WT>;
  },
  class: RXX,
};
