import { none, ResultOk, type Option } from "@chocbite/ts-lib-result";
import { StateBase } from "../base";
import {
  type StateRelated as RELATED,
  type State,
  type StateHelper,
  type StateROA,
} from "../types";

//##################################################################################################################################################
//      _____   ____
//     |  __ \ / __ \   /\
//     | |__) | |  | | /  \
//     |  _  /| |  | |/ /\ \
//     | | \ \| |__| / ____ \
//     |_|  \_\\____/_/    \_\
/**State Resource
 * state for representing a remote resource
 *
 * Debounce and Timout
 * example if the debounce is set to 50 and timeout to 200
 * singleGet will not be called until 50 ms after the first await of the state
 * when singleGet returns a Result, it is returned to all awaiters then buffered for the period of the timeout
 * any awaiters within the timeout will get the buffer, after that it starts over
 *
 * Debounce and Retention
 * When a subscriber is added the debounce delay is added before setupConnection is called
 * likevise when the last subscriber unsubscribes the retention delay is added before teardownConnection is called
 * this can prevent unneeded calls if the user is switching around quickly between things referencing states
 * @template RT - The type of the state’s value when read.
 * @template REL - The type of related states, defaults to an empty object.*/
export interface StateResourceOwnerROA<RT, WT, REL extends Option<RELATED>> {
  /**Updates the resource and fulfills all promises for value
   * @param update if true, also updates the buffer and notifies subscribers, otherwise only fulfills the promises for single gets*/
  update_single(value: ResultOk<RT>, update?: boolean): void;
  /**Updates the resource subscribers and buffer with the given value*/
  update_resource(value: ResultOk<RT>): void;
  get buffer(): ResultOk<RT> | undefined;
  get state(): State<RT, WT, REL>;
  get read_only(): StateROA<RT, REL, WT>;
}

export abstract class StateResourceROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
>
  extends StateBase<RT, WT, REL, ResultOk<RT>>
  implements StateResourceOwnerROA<RT, WT, REL>
{
  #valid: number | true = 0;
  #fetching: boolean = false;
  #buffer?: ResultOk<RT>;
  #retention_timout: number = 0;
  #debounce_timout: number = 0;
  #timeout_timout: number = 0;

  /**Timeout before giving generic error, if update_resource is not called*/
  abstract get timeout(): number;

  /**Debounce delaying one time value retrival*/
  abstract get debounce(): number;

  /**Timeout for validity of last buffered value*/
  abstract get validity(): number | true;

  /**Retention delay before resource performs teardown of connection is performed*/
  abstract get retention(): number;

  protected on_subscribe(): void {
    if (this.#retention_timout) {
      clearTimeout(this.#retention_timout);
      this.#retention_timout = 0;
    } else {
      if (this.debounce > 0)
        this.#debounce_timout = setTimeout(() => {
          this.setup_connection(this);
          this.#debounce_timout = 0;
        }, this.debounce);
      else this.setup_connection(this);
    }
  }

  protected on_unsubscribe(): void {
    if (this.#debounce_timout) {
      clearTimeout(this.#debounce_timout);
      this.#debounce_timout = 0;
    } else {
      if (this.retention > 0) {
        this.#retention_timout = setTimeout(() => {
          this.teardown_connection(this);
          this.#retention_timout = 0;
        }, this.retention);
      } else {
        this.teardown_connection(this);
      }
    }
    if (this.validity === true) this.#valid = 0;
  }

  /**Called if the state is awaited, returns the value once*/
  protected abstract single_get(
    state: StateResourceOwnerROA<RT, WT, REL>,
  ): void;

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected abstract setup_connection(
    state: StateResourceOwnerROA<RT, WT, REL>,
  ): void;

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected abstract teardown_connection(
    state: StateResourceOwnerROA<RT, WT, REL>,
  ): void;

  update_single(value: ResultOk<RT>, update: boolean = false) {
    this.#fetching = false;
    clearTimeout(this.#timeout_timout);
    this.ful_r_prom(value);
    if (update) {
      if (!this.#buffer?.compare(value)) this.update_subs(value);
      this.#buffer = value;
      this.#valid =
        this.validity === true ? true : performance.now() + this.validity;
    }
  }

  update_resource(value: ResultOk<RT>) {
    if (!this.#buffer?.compare(value)) this.update_subs(value);
    this.#buffer = value;
    this.#valid =
      this.validity === true ? true : performance.now() + this.validity;
  }

  get buffer(): ResultOk<RT> | undefined {
    return this.#buffer;
  }
  get state(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_only(): StateROA<RT, REL, WT> {
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
    if (this.#valid === true || this.#valid >= performance.now())
      return func(this.#buffer!);
    else {
      const prom = this.append_r_prom(func);
      if (!this.#fetching) {
        this.#fetching = true;
        this.#timeout_timout = setTimeout(
          () => (this.#fetching = false),
          this.timeout,
        );
        if (this.debounce > 0)
          setTimeout(() => this.single_get(this), this.debounce);
        else this.single_get(this);
      }
      return prom;
    }
  }

  //#Writer Context
  get writable(): boolean {
    return false;
  }
  get wsync(): boolean {
    return false;
  }
}

//##################################################################################################################################################
export interface Owner<
  RT,
  WT,
  REL extends Option<RELATED>,
> extends StateResourceOwnerROA<RT, WT, REL> {}
export type StateResourceFuncROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROA<RT, REL, WT> & Owner<RT, WT, REL>;

/**Alternative state resource which can be initialized with functions
 * @template RT - The type of the state’s value when read.
 * @template WT - The type which can be written to the state.
 * @template REL - The type of related states, defaults to an empty object.*/
class FuncROA<RT, REL extends Option<RELATED> = Option<{}>, WT = any>
  extends StateResourceROA<RT, REL, WT>
  implements Owner<RT, WT, REL>
{
  constructor(
    once: (state: Owner<RT, WT, REL>) => void,
    setup: (state: Owner<RT, WT, REL>) => void,
    teardown: (state: Owner<RT, WT, REL>) => void,
    timeout: number,
    debounce: number,
    validity: number | true,
    retention: number,
    helper?: StateHelper<WT, REL>,
  ) {
    super();
    this.single_get = once;
    this.setup_connection = setup;
    this.teardown_connection = teardown;
    this.timeout = timeout;
    this.debounce = debounce;
    this.validity = validity;
    this.retention = retention;
    if (helper) this.#helper = helper;
  }

  readonly timeout: number;
  readonly debounce: number;
  readonly validity: number | true;
  readonly retention: number;
  #helper?: StateHelper<WT, REL>;

  /**Called if the state is awaited, returns the value once*/
  protected single_get(_state: Owner<RT, WT, REL>): void {}

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected setup_connection(_state: Owner<RT, WT, REL>): void {}

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected teardown_connection(_state: Owner<RT, WT, REL>): void {}

  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }
}

const roa = {
  /**Alternative state resource which can be initialized with functions
   * @template READ - The type of the state’s value when read.
   * @template REL - The type of related states, defaults to an empty object.
   * @param once function called when state value is requested once
   * @param setup function called when state has been subscribed to
   * @param teardown function called when state has been unsubscribed from completely
   * @param debounce delay added to once value retrival, which will collect multiple once requests into a single one
   * @param validity how long the last retrived value is considered valid, if true, value is valid until all unsubscribes
   * @param retention delay after last subscriber unsubscribes before teardown is called, to allow quick resubscribe without teardown
   * */
  from<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    once: (state: Owner<RT, WT, REL>) => void,
    setup: (state: Owner<RT, WT, REL>) => void,
    teardown: (state: Owner<RT, WT, REL>) => void,
    times?: {
      timeout?: number;
      debounce?: number;
      validity?: number | true;
      retention?: number;
    },
    helper?: StateHelper<WT, REL>,
  ) {
    return new FuncROA<RT, REL, WT>(
      once,
      setup,
      teardown,
      times?.timeout ?? 1000,
      times?.debounce ?? 0,
      times?.validity ?? 0,
      times?.retention ?? 0,
      helper,
    ) as StateResourceFuncROA<RT, REL, WT>;
  },
  class: StateResourceROA,
};

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**State that represent a remote resource*/
export const STATE_RESOURCE_ROA = {
  /**Remote resource with guaranteed ok value */
  roa,
};
