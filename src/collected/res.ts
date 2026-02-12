import { err, none, OptionNone, type Result } from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import { type State, type StateRES } from "../types";
import type {
  StateCollectedStates,
  StateCollectedSubs,
  StateCollectedTransVal,
  StateCollectedTransValUnk,
} from "./shared";

//##################################################################################################################################################
//      _____  ______  _____
//     |  __ \|  ____|/ ____|
//     | |__) | |__  | (___
//     |  _  /|  __|  \___ \
//     | | \ \| |____ ____) |
//     |_|  \_\______|_____/
interface Owner<RT, IN extends StateRES<any>[], WT> {
  /**The `setStates` method is used to update the states used by the `StateDerived` class.
   * @param states - The new states. This function should accept an array of states and return the derived state.*/
  set_states(...states: StateCollectedStates<IN>): void;
  /**The `setGetter` method is used to update the getter function used by the `StateDerived` class.
   * This function is used to compute the derived state based on the current states.
   * @param getter - The new getter function. This function should accept an array of states and return the derived state.*/
  set_getter(
    getter: (values: StateCollectedTransVal<IN>) => Result<RT, string>,
  ): void;
  get state(): State<RT, WT, any>;
  get read_only(): StateRES<RT, any, WT>;
}
export type StateCollectedRES<
  RT,
  IN extends StateRES<any>[],
  WT = any,
> = StateRES<RT, OptionNone, WT> & Owner<RT, IN, WT>;

export class RES<RT, IN extends StateRES<any>[], WT>
  extends StateBase<RT, WT, OptionNone, Result<RT, string>>
  implements Owner<RT, IN, WT>
{
  /**Creates a state which is derived from other states. The derived state will update when any of the other states update.
   * @param transform - Function to translate value of state or states to something else, false means first states values is used.
   * @param states - The other states to be used in the derived state.*/
  constructor(
    transform:
      | ((values: StateCollectedTransVal<IN>) => Result<RT, string>)
      | false,
    ...states: IN
  ) {
    super();
    if (transform) this.getter = transform;
    this.#states = states;
  }

  #buffer?: Result<RT, string>;

  #states: IN;
  #state_buffers: StateCollectedTransValUnk<IN> =
    [] as StateCollectedTransValUnk<IN>;
  #state_subscribers: StateCollectedSubs<IN>[] = [];

  protected getter(values: StateCollectedTransVal<IN>): Result<RT, string> {
    return values[0];
  }

  /**Called when subscriber is added*/
  protected on_subscribe(): void {
    if (!this.#states.length) {
      this.#buffer = err("No states registered");
      return;
    }
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
  set_getter(
    getter: (values: StateCollectedTransVal<IN>) => Result<RT, string>,
  ) {
    if (this.in_use()) {
      this.on_unsubscribe();
      this.getter = getter;
      this.on_subscribe();
    } else this.getter = getter;
  }
  get state(): State<RT, WT, any> {
    return this as State<RT, WT, any>;
  }
  get read_only(): StateRES<RT, any, WT> {
    return this as StateRES<RT, any, WT>;
  }

  //#Reader Context
  get rok(): false {
    return false;
  }
  get rsync(): true {
    return true;
  }
  async then<T = Result<RT, string>>(
    func: (value: Result<RT, string>) => T | PromiseLike<T>,
  ): Promise<T> {
    return func(this.get());
  }
  get(): Result<RT, string> {
    if (this.#buffer) return this.#buffer;
    return this.#states.length
      ? this.getter(
          this.#states.map((s) => s.get()) as StateCollectedTransVal<IN>,
        )
      : err("No states registered");
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

/**Collected states, collects values from multiple states and reduces it to one */
export const STATE_COLLECTED_RES = {
  /**Creates a state that collects multiple states values and reduces it to one.
   * @param transform - Function to translate value of collected states, false means first states values is used.
   * @param states - The states to collect.*/
  from<RT, IN extends StateRES<any>[], WT = any>(
    transform:
      | ((values: StateCollectedTransVal<IN>) => Result<RT, string>)
      | false,
    ...states: IN
  ) {
    return new RES<RT, IN, WT>(transform, ...states) as StateCollectedRES<
      RT,
      IN,
      WT
    >;
  },
  class: RES,
};
