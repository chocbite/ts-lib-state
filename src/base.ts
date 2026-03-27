import { Option, ResultInferOk } from "@chocbite/ts-lib-result";
import {
  StateResult as SR,
  STATE_KEY,
  StateRelated,
  type StateBase as Base,
  type StateSub,
} from "./types";

export abstract class StateBase<
  RRT extends SR<any>,
  WT,
  REL extends Option<StateRelated>,
> implements Base<RRT, REL, WT> {
  get [STATE_KEY](): true {
    return true;
  }

  //#Reader Context
  abstract then<T = RRT>(
    func: (value: RRT) => T | PromiseLike<T>,
  ): PromiseLike<T>;

  abstract readonly rsync: boolean;
  get?(): RRT;

  abstract readonly rok: boolean;
  ok?(): ResultInferOk<RRT>;

  abstract related(): REL;

  #subscribers: Set<StateSub<RRT>> = new Set();
  sub<T = StateSub<RRT>>(func: StateSub<RRT>, update?: boolean): T {
    if (this.#subscribers.has(func)) {
      console.error("Function already registered as subscriber", this, func);
      return func as T;
    }
    if (this.#subscribers.size === 0) this.on_subscribe();
    this.#subscribers.add(func);
    if (update) this.then(func);
    return func as T;
  }
  unsub<T = StateSub<RRT>>(func: T): T {
    if (this.#subscribers.delete(func as StateSub<RRT>)) {
      if (this.#subscribers.size == 0) this.on_unsubscribe();
    } else console.error("Subscriber not found with state", this, func);
    return func;
  }

  in_use(): this | undefined {
    return this.#subscribers.size > 0 ? this : undefined;
  }
  has(subscriber: StateSub<RRT>): this | undefined {
    return this.#subscribers.has(subscriber) ? this : undefined;
  }
  amount(): number {
    return this.#subscribers.size;
  }

  //#Writer Context
  abstract readonly writable: boolean;
  write?(value: WT): Promise<SR<void>>;
  abstract limit(value: WT): Promise<SR<WT>>;
  abstract check(value: WT): Promise<SR<WT>>;

  /**Called when subscriber is added*/
  protected on_subscribe(): void {}
  /**Called when subscriber is removed*/
  protected on_unsubscribe(): void {}

  /**Updates all subscribers with a value */
  protected update_subs(value: RRT): void {
    for (const subscriber of this.#subscribers) {
      try {
        subscriber(value);
      } catch (e) {
        console.error("Failed while calling subscribers ", e, this, subscriber);
      }
    }
  }

  //Promises
  #read_promises?: ((val: RRT) => void)[];
  /**Creates a promise which can be fulfilled later with fulRProm */
  protected async append_r_prom<TResult1 = RRT>(
    func: (value: RRT) => TResult1 | PromiseLike<TResult1>,
  ): Promise<TResult1> {
    return func(
      await new Promise<RRT>((a) => {
        (this.#read_promises ??= []).push(a as (val: RRT) => void);
      }),
    );
  }
  /**Fulfills all read promises with given value */
  protected ful_r_prom(value: RRT): RRT {
    if (this.#read_promises)
      for (let i = 0; i < this.#read_promises.length; i++)
        this.#read_promises[i](value);
    this.#read_promises = [];
    return value;
  }
}
