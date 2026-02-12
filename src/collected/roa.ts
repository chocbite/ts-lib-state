import { none, OptionNone, type ResultOk } from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import { type State, type StateROA } from "../types";
import type {
  StateCollectedStates,
  StateCollectedSubs,
  StateCollectedTransVal,
  StateCollectedTransValUnk,
} from "./shared";

//##################################################################################################################################################
//      _____   ____
//     |  __ \ / __ \   /\
//     | |__) | |  | | /  \
//     |  _  /| |  | |/ /\ \
//     | | \ \| |__| / ____ \
//     |_|  \_\\____/_/    \_\
interface Owner<RT, IN extends [State<any>, ...State<any>[]], WT> {
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
  get read_only(): StateROA<RT, any, WT>;
}
export type StateCollectedROA<
  RT,
  IN extends [State<any>, ...State<any>[]],
  WT = any,
> = StateROA<RT, OptionNone, WT> & Owner<RT, IN, WT>;

export class ROA<RT, IN extends [State<any>, ...State<any>[]], WT>
  extends StateBase<RT, WT, OptionNone, ResultOk<RT>>
  implements Owner<RT, IN, WT>
{
  /**Creates a state which is derived from other states. The derived state will update when any of the other states update.
   * @param transform - Function to translate value of state or states to something else, false means first states values is used.
   * @param states - The other states to be used in the derived state.*/
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
    this.#state_buffers.length = this.#states.length;
    //Creates a new scope to hold count and amount variables
    {
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
  get read_only(): StateROA<RT, any, WT> {
    return this as StateROA<RT, any, WT>;
  }

  //#Reader Context
  get rok(): true {
    return true;
  }
  get rsync(): false {
    return false;
  }
  async then<T = ResultOk<RT>>(
    func: (value: ResultOk<RT>) => T | PromiseLike<T>,
  ): Promise<T> {
    if (this.#buffer) return func(this.#buffer);
    if (!this.#state_buffers.length)
      return func(
        this.getter(
          (await Promise.all(this.#states)) as StateCollectedTransVal<IN>,
        ),
      );
    return this.append_r_prom(func);
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

export const STATE_COLLECTED_ROA = {
  /**Creates a guarenteed ok state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  from<RT, IN extends [State<any>, ...State<any>[]], WT = any>(
    transform: ((values: StateCollectedTransVal<IN>) => ResultOk<RT>) | false,
    ...states: IN
  ) {
    return new ROA<RT, IN, WT>(transform, ...states) as StateCollectedROA<
      RT,
      IN,
      WT
    >;
  },
  class: ROA,
};
