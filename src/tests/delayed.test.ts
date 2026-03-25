import { sleep } from "@chocbite/ts-lib-common";
import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { assertType, describe, expect, it } from "vitest";
import {
  state as st,
  StateNormalREA,
  StateNormalREAW,
  StateNormalROA,
  StateNormalROAW,
  StateREA,
  StateREAW,
  StateROA,
  StateROAW,
} from "..";
import {
  test_state_sub,
  test_state_then,
  test_state_write,
  type TestStateAll,
  type TestStateWrite,
} from "./tests_shared";

describe("Initialize delayed states", function () {
  //##################################################################################################################################################
  //      _____   ____
  //     |  __ \ / __ \   /\
  //     | |__) | |  | | /  \
  //     |  _  /| |  | |/ /\ \
  //     | | \ \| |__| / ____ \
  //     |_|  \_\\____/_/    \_\
  describe("ROA", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.d.roa.ok(() => sleep(1, 1));
      assertType<StateROA<number>>(init);
      assertType<StateNormalROA<number>>(init);
    });
    it("result ok", async function () {
      const init = st.d.roa.result(() => sleep(1, ok(1)));
      assertType<StateROA<number>>(init);
      assertType<StateNormalROA<number>>(init);
    });
    it("cleanup successfull", async function () {
      const init = st.d.roa.ok(() => sleep(1, 1));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const then = init.then;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.then).not.eq(then, "then");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      expect(init.write).not.eq(write, "write");
    });
    //# Standard Tests
    const maker: TestStateAll = () => {
      const state = st.d.roa.ok(() => sleep(1, 1));
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 5);
    });
    describe("Then", async function () {
      await test_state_then(maker, 5);
    });
    const maker_delay: TestStateAll = () => {
      const state = st.d.roa.ok(() => sleep(10, 1));
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing With Actual Delay", async function () {
      await test_state_sub(maker_delay, 20);
    });
    describe("Then With Actual Delay", async function () {
      await test_state_then(maker_delay, 20);
    });
  });
  //##################################################################################################################################################
  //      _____  ______
  //     |  __ \|  ____|   /\
  //     | |__) | |__     /  \
  //     |  _  /|  __|   / /\ \
  //     | | \ \| |____ / ____ \
  //     |_|  \_\______/_/    \_\
  describe("REA", { timeout: 200 }, function () {
    it("ok", async function () {
      const init = st.d.rea.ok(() => sleep(1, 1));
      assertType<StateREA<number>>(init);
      assertType<StateNormalREA<number>>(init);
    });
    it("err", async function () {
      const init = st.d.rea.err<number>(() => sleep(1, "1"));
      assertType<StateREA<number>>(init);
      assertType<StateNormalREA<number>>(init);
    });
    it("result ok", async function () {
      const init = st.d.rea.result(() => sleep(1, ok(1)));
      assertType<StateREA<number>>(init);
      assertType<StateNormalREA<number>>(init);
    });
    it("cleanup successfull", async function () {
      const init = st.d.rea.ok(() => sleep(1, 1));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const then = init.then;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.then).not.eq(then, "then");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      expect(init.write).not.eq(write, "write");
    });
    //# Standard Tests
    const maker: TestStateAll = () => {
      const state = st.d.rea.ok(() => sleep(1, 1));
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 5);
    });
    describe("Then", async function () {
      await test_state_then(maker, 5);
    });
    const maker_delay: TestStateAll = () => {
      const state = st.d.rea.ok(() => sleep(10, 1));
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing With Actual Delay", async function () {
      await test_state_sub(maker_delay, 20);
    });
    describe("Then With Actual Delay", async function () {
      await test_state_then(maker_delay, 20);
    });
  });
  //##################################################################################################################################################
  //      _____   ____     __          __
  //     |  __ \ / __ \   /\ \        / /
  //     | |__) | |  | | /  \ \  /\  / /
  //     |  _  /| |  | |/ /\ \ \/  \/ /
  //     | | \ \| |__| / ____ \  /\  /
  //     |_|  \_\\____/_/    \_\/  \/
  describe("ROAW", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.d.roaw.ok(() => sleep(1, 1));
      assertType<StateROAW<number>>(init);
      assertType<StateNormalROAW<number>>(init);
    });
    it("result ok", async function () {
      const init = st.d.roaw.result(() => sleep(1, ok(1)));
      assertType<StateROAW<number>>(init);
      assertType<StateNormalROAW<number>>(init);
    });
    it("cleanup successfull", async function () {
      const init = st.d.roaw.ok(() => sleep(1, 1));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const then = init.then;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.then).not.eq(then, "then");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      expect(init.write).not.eq(write, "write");
    });
    //# Standard Tests
    const maker: TestStateAll = () => {
      const state = st.d.roaw.ok(() => sleep(1, 1));
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: false, w: true, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 5);
    });
    describe("Then", async function () {
      await test_state_then(maker, 5);
    });
    const maker_delay: TestStateAll = () => {
      const state = st.d.roaw.ok(() => sleep(10, 1));
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: false, w: true, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing With Actual Delay", async function () {
      await test_state_sub(maker_delay, 20);
    });
    describe("Then With Actual Delay", async function () {
      await test_state_then(maker_delay, 20);
    });
    const maker_write: TestStateWrite = () => {
      const state = st.d.roaw.ok(() => sleep(10, 1), true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: false, w: true, ws: false, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
  //##################################################################################################################################################
  //      _____  ______     __          __
  //     |  __ \|  ____|   /\ \        / /
  //     | |__) | |__     /  \ \  /\  / /
  //     |  _  /|  __|   / /\ \ \/  \/ /
  //     | | \ \| |____ / ____ \  /\  /
  //     |_|  \_\______/_/    \_\/  \/
  describe("REAW", { timeout: 200 }, function () {
    it("ok", async function () {
      const init = st.d.reaw.ok(() => sleep(1, 1));
      assertType<StateREAW<number>>(init);
      assertType<StateNormalREAW<number>>(init);
    });
    it("err", async function () {
      const init = st.d.reaw.err<number>(() => sleep(1, "1"));
      assertType<StateREAW<number>>(init);
      assertType<StateNormalREAW<number>>(init);
    });
    it("result ok", async function () {
      const init = st.d.reaw.result(() => sleep(1, ok(1)));
      assertType<StateREAW<number>>(init);
      assertType<StateNormalREAW<number>>(init);
    });
    it("cleanup successfull", async function () {
      const init = st.d.reaw.ok(() => sleep(1, 1));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const then = init.then;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.then).not.eq(then, "then");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      expect(init.write).not.eq(write, "write");
    });
    //# Standard Tests
    const maker: TestStateAll = () => {
      const state = st.d.reaw.ok(() => sleep(1, 1));
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: false, w: true, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 5);
    });
    describe("Then", async function () {
      await test_state_then(maker, 5);
    });
    const maker_delay: TestStateAll = () => {
      const state = st.d.reaw.ok(() => sleep(10, 1));
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: false, w: true, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing With Actual Delay", async function () {
      await test_state_sub(maker_delay, 20);
    });
    describe("Then With Actual Delay", async function () {
      await test_state_then(maker_delay, 20);
    });
    const maker_write: TestStateWrite = () => {
      const state = st.d.reaw.ok(() => sleep(10, 1), true);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: false, w: true, ws: false, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
});
