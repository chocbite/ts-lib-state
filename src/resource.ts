import {
  err,
  none,
  ok,
  ResultOk,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { StateBase } from "./base";
import { type StateHelper as Helper } from "./helpers";
import {
  StateROA,
  StateROAW,
  type StateRelated as RELATED,
  type State,
  type StateREA,
  type StateREAW,
} from "./types";

//##################################################################################################################################################
//      _________     _______  ______  _____
//     |__   __\ \   / /  __ \|  ____|/ ____|
//        | |   \ \_/ /| |__) | |__  | (___
//        | |    \   / |  ___/|  __|  \___ \
//        | |     | |  | |    | |____ ____) |
//        |_|     |_|  |_|    |______|_____/
export interface StateResourceOwner<
  RT,
  WT,
  REL extends Option<RELATED>,
  RRT extends Result<RT, string>,
> {
  /**Updates the resource and fulfills all promises for value
   * @param update if true, also updates the buffer and notifies subscribers, otherwise only fulfills the promises for single gets*/
  update_single(value: RRT, update?: boolean): void;
  /**Updates the resource subscribers and buffer with the given value*/
  update_resource(value: RRT): void;
  /**Gets the current buffer value*/
  get buffer(): RRT | undefined;
  get state(): State<RT, WT, REL>;
}

export type StateResourceFuncREA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateREA<RT, REL, WT> &
  StateResourceOwner<RT, WT, REL, Result<RT, string>> & {
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write?: StateREAW<RT, WT, REL>;
  };

export type StateResourceFuncROA<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROA<RT, REL, WT> &
  StateResourceOwner<RT, WT, REL, ResultOk<RT>> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write?: StateROAW<RT, WT, REL>;
  };

export type StateResourceFuncREAW<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateREAW<RT, WT, REL> &
  StateResourceOwner<RT, WT, REL, Result<RT, string>> & {
    readonly read_only: StateREA<RT, REL, WT>;
    readonly read_write: StateREAW<RT, WT, REL>;
  };

export type StateResourceFuncROAW<
  RT,
  REL extends Option<RELATED> = Option<{}>,
  WT = any,
> = StateROAW<RT, WT, REL> &
  StateResourceOwner<RT, WT, REL, ResultOk<RT>> & {
    readonly read_only: StateROA<RT, REL, WT>;
    readonly read_write: StateROAW<RT, WT, REL>;
  };

//##################################################################################################################################################
//      ____           _____ ______    _____ _                _____ _____
//     |  _ \   /\    / ____|  ____|  / ____| |        /\    / ____/ ____|
//     | |_) | /  \  | (___ | |__    | |    | |       /  \  | (___| (___
//     |  _ < / /\ \  \___ \|  __|   | |    | |      / /\ \  \___ \\___ \
//     | |_) / ____ \ ____) | |____  | |____| |____ / ____ \ ____) |___) |
//     |____/_/    \_\_____/|______|  \_____|______/_/    \_\_____/_____/

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
 * @template RRT - The type of the state’s result
 * @template REL - The type of related states, defaults to an empty object.*/
export abstract class StateResource<
  RT,
  REL extends Option<RELATED>,
  WT,
  RRT extends Result<RT, string>,
>
  extends StateBase<RT, WT, REL, RRT>
  implements StateResourceOwner<RT, WT, REL, RRT>
{
  #valid: number | true = 0;
  #fetching: boolean = false;
  #buffer?: RRT;
  #retention_timout: number = 0;
  #debounce_timout: number = 0;
  #timeout_timout: number = 0;
  #write_buffer?: WT;
  #write_debounce_timout: number = 0;
  #write_promises: ((val: Result<void, string>) => void)[] = [];

  /**Timeout before giving generic error, if update_resource is not called*/
  abstract get timeout(): number;

  /**Debounce delaying one time value retrival*/
  abstract get debounce(): number;

  /**Timeout for validity of last buffered value*/
  abstract get validity(): number | true;

  /**Retention delay before resource performs teardown of connection is performed*/
  abstract get retention(): number;

  /**How long to debounce write calls, before the last write call is used*/
  abstract get write_debounce(): number;

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
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ): void;

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected abstract setup_connection(
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ): void;

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected abstract teardown_connection(
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ): void;

  /**Called after write debounce finished with the last written value*/
  protected abstract write_action(
    value: WT,
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ): Promise<Result<void, string>>;

  update_single(value: RRT, update: boolean = false) {
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

  update_resource(value: RRT) {
    if (!this.#buffer?.compare(value)) this.update_subs(value);
    this.#buffer = value;
    this.#valid =
      this.validity === true ? true : performance.now() + this.validity;
  }

  get buffer(): RRT | undefined {
    return this.#buffer;
  }

  get state(): State<RT, WT, REL> {
    return this as State<RT, WT, any>;
  }
  get read_only(): StateREA<RT, REL, WT> {
    return this as StateREA<RT, any, WT>;
  }
  get read_write(): State<RT, WT, REL> | undefined {
    return this.writable ? (this as State<RT, WT, any>) : undefined;
  }

  //#Reader Context
  abstract get rok(): boolean;

  get rsync(): false {
    return false;
  }
  async then<T = RRT>(func: (value: RRT) => T | PromiseLike<T>): Promise<T> {
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
  abstract get writable(): boolean;

  async write(value: WT): Promise<Result<void, string>> {
    this.#write_buffer = value;
    if (this.write_debounce === 0) return this.write_action(value, this);
    else if (this.#write_debounce_timout === 0)
      this.#write_debounce_timout = window.setTimeout(async () => {
        this.#write_debounce_timout = 0;
        const write_buffer = this.#write_buffer;
        this.#write_buffer = undefined;
        const promises = this.#write_promises;
        this.#write_promises = [];
        const res = await this.write_action(write_buffer!, this);
        for (let i = 0; i < promises.length; i++) promises[i](res);
      }, this.write_debounce);
    return new Promise<Result<void, string>>((a) => {
      this.#write_promises.push(a);
    });
  }

  abstract limit(value: WT): Promise<Result<WT, string>>;

  abstract check(value: WT): Promise<Result<WT, string>>;
}

//##################################################################################################################################################
//      ______ _    _ _   _  _____ _______ _____ ____  _   _    _____ _                _____ _____
//     |  ____| |  | | \ | |/ ____|__   __|_   _/ __ \| \ | |  / ____| |        /\    / ____/ ____|
//     | |__  | |  | |  \| | |       | |    | || |  | |  \| | | |    | |       /  \  | (___| (___
//     |  __| | |  | | . ` | |       | |    | || |  | | . ` | | |    | |      / /\ \  \___ \\___ \
//     | |    | |__| | |\  | |____   | |   _| || |__| | |\  | | |____| |____ / ____ \ ____) |___) |
//     |_|     \____/|_| \_|\_____|  |_|  |_____\____/|_| \_|  \_____|______/_/    \_\_____/_____/

/**Alternative state resource which can be initialized with functions
 * @template RT - The type of the state’s value when read.
 * @template WT - The type which can be written to the state.
 * @template REL - The type of related states, defaults to an empty object.*/
class Func<
  RT,
  REL extends Option<RELATED>,
  WT,
  RRT extends Result<RT, string>,
> extends StateResource<RT, REL, WT, RRT> {
  constructor(
    read_ok: boolean,
    once: (state: StateResourceOwner<RT, WT, REL, RRT>) => void,
    setup: (state: StateResourceOwner<RT, WT, REL, RRT>) => void,
    teardown: (state: StateResourceOwner<RT, WT, REL, RRT>) => void,
    timeout: number,
    debounce: number,
    validity: number | true,
    retention: number,
    write_debounce?: number,
    write_action?: (
      value: WT,
      state: StateResourceOwner<RT, WT, REL, RRT>,
    ) => Promise<Result<void, string>>,
    helper?: Helper<WT, REL>,
  ) {
    super();
    this.#rok = read_ok;
    this.single_get = once;
    this.setup_connection = setup;
    this.teardown_connection = teardown;
    this.#write_action = write_action;
    this.timeout = timeout;
    this.debounce = debounce;
    this.validity = validity;
    this.retention = retention;
    this.write_debounce = write_debounce || 0;
    if (helper) this.#helper = helper;
  }

  readonly timeout: number;
  readonly debounce: number;
  readonly validity: number | true;
  readonly retention: number;
  readonly write_debounce: number;

  #rok: boolean;
  #write_action?: (
    value: WT,
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ) => Promise<Result<void, string>>;
  #helper?: Helper<WT, REL>;

  get rok(): boolean {
    return this.#rok;
  }

  /**Called if the state is awaited, returns the value once*/
  protected single_get(_state: StateResourceOwner<RT, WT, REL, RRT>): void {}

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected setup_connection(
    _state: StateResourceOwner<RT, WT, REL, RRT>,
  ): void {}

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected teardown_connection(
    _state: StateResourceOwner<RT, WT, REL, RRT>,
  ): void {}

  get writable(): boolean {
    return Boolean(this.#write_action);
  }

  protected write_action(
    value: WT,
    state: StateResourceOwner<RT, WT, REL, RRT>,
  ): Promise<Result<void, string>> {
    if (this.#write_action) return this.#write_action(value, state);
    else return Promise.resolve(err("not writable"));
  }

  limit(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.limit
      ? this.#helper.limit(value)
      : Promise.resolve(ok(value));
  }

  check(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.check
      ? this.#helper.check(value)
      : Promise.resolve(ok(value));
  }

  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }
}

//##################################################################################################################################################
//       _____ ______ _   _ ______ _____         _______ ____  _____   _____
//      / ____|  ____| \ | |  ____|  __ \     /\|__   __/ __ \|  __ \ / ____|
//     | |  __| |__  |  \| | |__  | |__) |   /  \  | | | |  | | |__) | (___
//     | | |_ |  __| | . ` |  __| |  _  /   / /\ \ | | | |  | |  _  / \___ \
//     | |__| | |____| |\  | |____| | \ \  / ____ \| | | |__| | | \ \ ____) |
//      \_____|______|_| \_|______|_|  \_\/_/    \_\_|  \____/|_|  \_\_____/

const rea = {
  /**Alternative state resource which can be initialized with functions
   * @template READ - The type of the state’s value when read.
   * @template REL - The type of related states, defaults to an empty object.
   * @param once function called when state value is requested once
   * @param setup function called when state has been subscribed to
   * @param teardown function called when state has been unsubscribed from completely
   * @param debounce delay added to once value retrival, which will collect multiple once requests into a single one
   * @param validity how long the last retrived value is considered valid
   * @param retention delay after last subscriber unsubscribes before teardown is called, to allow quick resubscribe without teardown
   * */
  from<RT, REL extends Option<RELATED> = Option<{}>, WT = any>(
    once: (state: StateResourceOwner<RT, WT, REL, Result<RT, string>>) => void,
    setup: (state: StateResourceOwner<RT, WT, REL, Result<RT, string>>) => void,
    teardown: (
      state: StateResourceOwner<RT, WT, REL, Result<RT, string>>,
    ) => void,
    times?: {
      timeout?: number;
      debounce?: number;
      validity?: number | true;
      retention?: number;
    },
    helper?: Helper<WT, REL>,
  ) {
    return new Func<RT, REL, WT, Result<RT, string>>(
      false,
      once,
      setup,
      teardown,
      times?.timeout ?? 1000,
      times?.debounce ?? 0,
      times?.validity ?? 0,
      times?.retention ?? 0,
      undefined,
      undefined,
      helper,
    ) as StateResourceFuncREA<RT, REL, WT>;
  },
};

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
    once: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    setup: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    teardown: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    times?: {
      timeout?: number;
      debounce?: number;
      validity?: number | true;
      retention?: number;
    },
    helper?: Helper<WT, REL>,
  ) {
    return new Func<RT, REL, WT, ResultOk<RT>>(
      true,
      once,
      setup,
      teardown,
      times?.timeout ?? 1000,
      times?.debounce ?? 0,
      times?.validity ?? 0,
      times?.retention ?? 0,
      undefined,
      undefined,
      helper,
    ) as StateResourceFuncROA<RT, REL, WT>;
  },
};

const reaw = {
  /**Alternative state resource which can be initialized with functions
   * @template READ - The type of the state’s value when read.
   * @template WT - The type which can be written to the state.
   * @template REL - The type of related states, defaults to an empty object.
   * @param once function called when state value is requested once, returns a Err(string) on failure
   * @param setup function called when state has been subscribed to
   * @param teardown function called when state has been unsubscribed from completely
   * @param write_action function called after write debounce finished with the last written value
   * @param debounce delay added to once value retrival, which will collect multiple once requests into a single one
   * @param validity how long the last retrived value is considered valid
   * @param retention delay after last subscriber unsubscribes before teardown is called, to allow quick resubscribe without teardown
   * @param write_debounce debounce delay for write calls, only the last write within the delay is used
   * */
  from<RT, REL extends Option<RELATED> = Option<{}>, WT = RT>(
    once: (state: StateResourceOwner<RT, WT, REL, Result<RT, string>>) => void,
    setup: (state: StateResourceOwner<RT, WT, REL, Result<RT, string>>) => void,
    teardown: (
      state: StateResourceOwner<RT, WT, REL, Result<RT, string>>,
    ) => void,
    write_action?: (
      value: WT,
      state: StateResourceOwner<RT, WT, REL, Result<RT, string>>,
    ) => Promise<Result<void, string>>,
    times?: {
      timeout?: number;
      debounce?: number;
      validity?: number | true;
      retention?: number;
      write_debounce?: number;
    },
    helper?: Helper<WT, REL>,
  ) {
    return new Func<RT, REL, WT, Result<RT, string>>(
      false,
      once,
      setup,
      teardown,
      times?.timeout ?? 1000,
      times?.debounce ?? 0,
      times?.validity ?? 0,
      times?.retention ?? 0,
      times?.write_debounce ?? 0,
      write_action,
      helper,
    ) as StateResourceFuncREAW<RT, REL, WT>;
  },
};

const roaw = {
  /**Alternative state resource which can be initialized with functions
   * @template READ - The type of the state’s value when read.
   * @template WT - The type which can be written to the state.
   * @template REL - The type of related states, defaults to an empty object.
   * @param once function called when state value is requested once, returns a Err(string) on failure
   * @param setup function called when state has been subscribed to
   * @param teardown function called when state has been unsubscribed from completely
   * @param write_action function called after write debounce finished with the last written value
   * @param debounce delay added to once value retrival, which will collect multiple once requests into a single one
   * @param validity how long the last retrived value is considered valid
   * @param retention delay after last subscriber unsubscribes before teardown is called, to allow quick resubscribe without teardown
   * @param write_debounce debounce delay for write calls, only the last write within the delay is used
   * */
  from<RT, REL extends Option<RELATED> = Option<{}>, WT = RT>(
    once: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    setup: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    teardown: (state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>) => void,
    write_action?: (
      value: WT,
      state: StateResourceOwner<RT, WT, REL, ResultOk<RT>>,
    ) => Promise<Result<void, string>>,
    times?: {
      timeout?: number;
      debounce?: number;
      validity?: number | true;
      retention?: number;
      write_debounce?: number;
    },
    helper?: Helper<WT, REL>,
  ) {
    return new Func<RT, REL, WT, ResultOk<RT>>(
      true,
      once,
      setup,
      teardown,
      times?.timeout ?? 1000,
      times?.debounce ?? 0,
      times?.validity ?? 0,
      times?.retention ?? 0,
      times?.write_debounce ?? 0,
      write_action,
      helper,
    ) as StateResourceFuncREAW<RT, REL, WT>;
  },
};

//##################################################################################################################################################
//      _____  ______     __          __
//     |  __ \|  ____|   /\ \        / /
//     | |__) | |__     /  \ \  /\  / /
//     |  _  /|  __|   / /\ \ \/  \/ /
//     | | \ \| |____ / ____ \  /\  /
//     |_|  \_\______/_/    \_\/  \/

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
 * @template WT - The type which can be written to the state.
 * @template REL - The type of related states, defaults to an empty object.*/
export interface StateResourceOwnerREAW<RT, WT, REL extends Option<RELATED>> {
  /**Updates the resource and fulfills all promises for value
   * @param update if true, also updates the buffer and notifies subscribers, otherwise only fulfills the promises for single gets*/
  update_single(value: Result<RT, string>, update?: boolean): void;
  /**Updates the resource subscribers and buffer with the given value*/
  update_resource(value: Result<RT, string>): void;
  get buffer(): Result<RT, string> | undefined;
  get state(): State<RT, WT, REL>;
  get read_only(): StateREA<RT, REL, WT>;
  get read_write(): StateREAW<RT, WT, REL>;
}

export abstract class StateResourceREAW<
  RT,
  WT = RT,
  REL extends Option<RELATED> = Option<{}>,
>
  extends StateBase<RT, WT, REL, Result<RT, string>>
  implements StateResourceOwnerREAW<RT, WT, REL>
{
  #valid: number | true = 0;
  #fetching: boolean = false;
  #buffer?: Result<RT, string>;
  #retention_timout: number = 0;
  #debounce_timout: number = 0;
  #timeout_timout: number = 0;
  #write_buffer?: WT;
  #write_debounce_timout: number = 0;
  #write_promises: ((val: Result<void, string>) => void)[] = [];

  /**Timeout before giving generic error, if update_resource is not called*/
  abstract get timeout(): number;

  /**Debounce delaying one time value retrival*/
  abstract get debounce(): number;

  /**Timeout for validity of last buffered value*/
  abstract get validity(): number | true;

  /**Retention delay before resource performs teardown of connection is performed*/
  abstract get retention(): number;

  /**How long to debounce write calls, before the last write call is used*/
  abstract get write_debounce(): number;

  protected on_subscribe() {
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

  protected on_unsubscribe() {
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
    state: StateResourceOwnerREAW<RT, WT, REL>,
  ): void;

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected abstract setup_connection(
    state: StateResourceOwnerREAW<RT, WT, REL>,
  ): void;

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected abstract teardown_connection(
    state: StateResourceOwnerREAW<RT, WT, REL>,
  ): void;

  /**Called after write debounce finished with the last written value*/
  protected abstract write_action(
    value: WT,
    state: StateResourceOwnerREAW<RT, WT, REL>,
  ): Promise<Result<void, string>>;

  update_single(value: Result<RT, string>, update: boolean = false) {
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

  update_resource(value: Result<RT, string>) {
    if (!this.#buffer?.compare(value)) this.update_subs(value);
    this.#buffer = value;
    this.#valid =
      this.validity === true ? true : performance.now() + this.validity;
  }

  get buffer(): Result<RT, string> | undefined {
    return this.#buffer;
  }
  get state(): State<RT, WT, REL> {
    return this as State<RT, WT, REL>;
  }
  get read_only(): StateREA<RT, REL, WT> {
    return this as StateREA<RT, REL, WT>;
  }
  get read_write(): StateREAW<RT, WT, REL> {
    return this as StateREAW<RT, WT, REL>;
  }

  //Reader Context
  get rok(): false {
    return false;
  }
  get rsync(): false {
    return false;
  }
  async then<T = Result<RT, string>>(
    func: (value: Result<RT, string>) => T | PromiseLike<T>,
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

  //Writer Context
  get writable(): true {
    return true;
  }
  async write(value: WT): Promise<Result<void, string>> {
    this.#write_buffer = value;
    if (this.write_debounce === 0) return this.write_action(value, this);
    else if (this.#write_debounce_timout === 0)
      this.#write_debounce_timout = window.setTimeout(async () => {
        this.#write_debounce_timout = 0;
        const write_buffer = this.#write_buffer;
        this.#write_buffer = undefined;
        const promises = this.#write_promises;
        this.#write_promises = [];
        const res = await this.write_action(write_buffer!, this);
        for (let i = 0; i < promises.length; i++) promises[i](res);
      }, this.write_debounce);
    return new Promise<Result<void, string>>((a) => {
      this.#write_promises.push(a);
    });
  }

  abstract limit(value: WT): Promise<Result<WT, string>>;

  abstract check(value: WT): Promise<Result<WT, string>>;
}

//##################################################################################################################################################
export interface OwnerWrite<
  RT,
  WT,
  REL extends Option<RELATED>,
> extends StateResourceOwnerREAW<RT, WT, REL> {}

/**Alternative state resource which can be initialized with functions
 * @template RT - The type of the state’s value when read.
 * @template WT - The type which can be written to the state.
 * @template REL - The type of related states, defaults to an empty object.*/

class FuncREAW<RT, WT = RT, REL extends Option<RELATED> = Option<{}>>
  extends StateResourceREAW<RT, WT, REL>
  implements OwnerWrite<RT, WT, REL>
{
  constructor(
    once: (state: OwnerWrite<RT, WT, REL>) => void,
    setup: (state: OwnerWrite<RT, WT, REL>) => void,
    teardown: (state: OwnerWrite<RT, WT, REL>) => void,
    timeout: number,
    debounce: number,
    validity: number | true,
    retention: number,
    write_debounce?: number,
    write_action?: (
      value: WT,
      state: OwnerWrite<RT, WT, REL>,
    ) => Promise<Result<void, string>>,
    helper?: Helper<WT, REL>,
  ) {
    super();
    this.single_get = once;
    this.setup_connection = setup;
    this.teardown_connection = teardown;
    if (write_action) this.write_action = write_action;
    this.timeout = timeout;
    this.debounce = debounce;
    this.validity = validity;
    this.retention = retention;
    this.write_debounce = write_debounce || 0;
    if (helper) this.#helper = helper;
  }

  readonly timeout: number;
  readonly debounce: number;
  readonly validity: number | true;
  readonly retention: number;
  readonly write_debounce: number;
  #helper?: Helper<WT, REL>;

  /**Called if the state is awaited, returns the value once*/
  protected single_get(_state: OwnerWrite<RT, WT, REL>): void {}

  /**Called when state is subscribed to to setup connection to remote resource*/
  protected setup_connection(_state: OwnerWrite<RT, WT, REL>): void {}

  /**Called when state is no longer subscribed to to cleanup connection to remote resource*/
  protected teardown_connection(_state: OwnerWrite<RT, WT, REL>): void {}

  /**Called after write debounce finished with the last written value*/
  protected async write_action(
    _value: WT,
    _state: OwnerWrite<RT, WT, REL>,
  ): Promise<Result<void, string>> {
    return err("not writable");
  }

  limit(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.limit
      ? this.#helper.limit(value)
      : Promise.resolve(ok(value));
  }

  check(value: WT): Promise<Result<WT, string>> {
    return this.#helper?.check
      ? this.#helper.check(value)
      : Promise.resolve(ok(value));
  }

  related(): REL {
    return this.#helper?.related ? this.#helper.related() : (none() as REL);
  }
}

//##################################################################################################################################################
//      ________   _______   ____  _____ _______ _____
//     |  ____\ \ / /  __ \ / __ \|  __ \__   __/ ____|
//     | |__   \ V /| |__) | |  | | |__) | | | | (___
//     |  __|   > < |  ___/| |  | |  _  /  | |  \___ \
//     | |____ / . \| |    | |__| | | \ \  | |  ____) |
//     |______/_/ \_\_|     \____/|_|  \_\ |_| |_____/

/**State that represent a remote resource*/
export const STATE_RESOURCE = {
  /**Extension class for making custom state resources */
  class: StateResource,
  /**Remote resource */
  rea,
  /**Remote resource, guarenteed ok */
  roa,
  /**Remote resource with write cabability */
  reaw,
  /**Remote resource with write cabability, guarenteed ok */
  roaw,
};
