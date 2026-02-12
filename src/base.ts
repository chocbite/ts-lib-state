import { type Option, type Result } from "@chocbite/ts-lib-result";
import {
  STATE_KEY,
  type StateBase as Base,
  type StateRelated,
  type StateSub,
} from "./types";

export abstract class StateBase<
  RT,
  WT,
  REL extends Option<StateRelated>,
  RRT extends Result<RT, string>,
> implements Base<RT, WT, REL, RRT> {
  get [STATE_KEY](): true {
    return true;
  }

  #subscribers: Set<StateSub<RRT>> = new Set();
  #read_promises?: ((val: RRT) => void)[];

  //#Reader Context
  abstract readonly rsync: boolean;
  abstract readonly rok: boolean;
  abstract then<T = RRT>(
    func: (value: RRT) => T | PromiseLike<T>,
  ): PromiseLike<T>;
  get?(): RRT;
  ok?(): RT;
  sub<T = StateSub<RRT>>(func: StateSub<RRT>, update?: boolean): T {
    if (this.#subscribers.has(func)) {
      console.error("Function already registered as subscriber", this, func);
      return func as T;
    }
    if (this.#subscribers.size === 0) this.on_subscribe();
    this.#subscribers.add(func);
    if (update) this.then(func as (value: Result<RT, string>) => void);
    return func as T;
  }
  unsub<T = StateSub<RRT>>(func: T): T {
    if (this.#subscribers.delete(func as StateSub<RRT>)) {
      if (this.#subscribers.size == 0) this.on_unsubscribe();
    } else console.error("Subscriber not found with state", this, func);
    return func;
  }
  abstract related(): REL;

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
  abstract readonly wsync: boolean;
  abstract readonly writable: boolean;

  write?(value: WT): Promise<Result<void, string>>;
  limit?(value: WT): Result<WT, string>;
  check?(value: WT): Result<WT, string>;
  write_sync?(value: WT): Result<void, string>;

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
  /**Creates a promise which can be fulfilled later with fulRProm */
  protected async append_r_prom<
    T = Result<RT, string>,
    TResult1 = Result<RT, string>,
  >(func: (value: T) => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {
    return func(
      await new Promise<T>((a) => {
        (this.#read_promises ??= []).push(
          a as (val: Result<RT, string>) => void,
        );
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
