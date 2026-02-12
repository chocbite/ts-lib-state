import { none, OptionNone, type ResultOk } from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import { type State, type StateRES, type StateROS } from "../types";
import type {
  StateCollectedStates,
  StateCollectedSubs,
  StateCollectedTransVal,
  StateCollectedTransValUnk,
} from "./shared";

//##################################################################################################################################################
//      _____   ____   _____
//     |  __ \ / __ \ / ____|
//     | |__) | |  | | (___
//     |  _  /| |  | |\___ \
//     | | \ \| |__| |____) |
//     |_|  \_\\____/|_____/
interface Owner<RT, IN extends [StateRES<any>, ...StateRES<any>[]], WT> {
  /**The `setStates` method is used to update the states used by the `StateDerived` class.
   * @param states - The new states. This function should accept an array of states and return the derived state.*/
  set_states(...states: StateCollectedStates<IN>): void;
  /**The `setGetter` method is used to update the getter function used by the `StateDerived` class.
   * This function is used to compute the derived state based on the current states.
   * @param getter - The new getter function. This function should accept an array of states and return the derived state.*/
  set_getter(
    getter: (values: StateCollectedTransVal<IN>) => ResultOk<RT>,
  ): void;
  get state(): State<RT, WT, any>;
  get read_only(): StateROS<RT, any, WT>;
}
export type StateCollectedROS<
  RT,
  IN extends [StateRES<any>, ...StateRES<any>[]],
  WT = any,
> = StateROS<RT, OptionNone, WT> & Owner<RT, IN, WT>;

export class ROS<RT, IN extends [StateRES<any>, ...StateRES<any>[]], WT>
  extends StateBase<RT, WT, OptionNone, ResultOk<RT>>
  implements Owner<RT, IN, WT>
{
  constructor(
    transform: ((values: StateCollectedTransVal<IN>) => ResultOk<RT>) | false,
    ...states: IN
  ) {
    super();
    if (transform) this.getter = transform;
    this.#states = states;
  }

  #buffer?: ResultOk<RT>;

  #states: IN;
  #state_buffers: StateCollectedTransValUnk<IN> =
    [] as StateCollectedTransValUnk<IN>;
  #state_subscribers: StateCollectedSubs<IN>[] = [];

  protected getter(values: StateCollectedTransVal<IN>): ResultOk<RT> {
    return values[0] as ResultOk<RT>;
  }

  /**Called when subscriber is added*/
  protected on_subscribe() {
    let calc = false;
    for (let i = 0; i < this.#states.length; i++) {
      this.#state_buffers[i] = this.#states[i].get();
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
    this.#buffer = this.getter(
      this.#state_buffers as StateCollectedTransVal<IN>,
    );
    this.update_subs(this.#buffer);
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
  set_getter(getter: (values: StateCollectedTransVal<IN>) => ResultOk<RT>) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.getter = getter;
      this.on_subscribe();
    } else this.getter = getter;
  }
  get state(): State<RT, WT, any> {
    return this as State<RT, WT, any>;
  }
  get read_only(): StateROS<RT, any, WT> {
    return this as StateROS<RT, any, WT>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): true {
    return true;
  }
  async then<T = ResultOk<RT>>(
    func: (value: ResultOk<RT>) => T | PromiseLike<T>,
  ): Promise<T> {
    return func(this.get());
  }
  get(): ResultOk<RT> {
    if (this.#buffer) return this.#buffer;
    return this.getter(
      this.#states.map((s) => s.get()) as StateCollectedTransVal<IN>,
    );
  }
  ok(): RT {
    return this.get().value;
  }
  related(): OptionNone {
    return none();
  }

  //#Writer Context
  get writable(): boolean {
    return false;
  }
  get wsync(): boolean {
    return false;
  }
}

export const STATE_COLLECTED_ROS = {
  /**Creates a guarenteed ok state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  from<RT, IN extends [StateRES<any>, ...StateRES<any>[]], WT = any>(
    transform: ((values: StateCollectedTransVal<IN>) => ResultOk<RT>) | false,
    ...states: IN
  ) {
    return new ROS<RT, IN, WT>(transform, ...states) as StateCollectedROS<
      RT,
      IN,
      WT
    >;
  },
  class: ROS,
};
