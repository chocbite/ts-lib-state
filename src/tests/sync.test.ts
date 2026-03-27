import { err, ok, ResultOk } from "@chocbite/ts-lib-result";
import { assertType, describe, it } from "vitest";
import { state as st, StateROS } from "..";
import {
  test_state_get,
  test_state_get_ok,
  test_state_sub,
  test_state_then,
  test_state_write,
  TestStateWrite,
  type TestStateOkSync,
  type TestStateSync,
} from "./tests_shared";

describe("Sync states", function () {
  describe("ROS", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.ros(ok(1));
      assertType<StateROS<number>>(init);
    });
    const maker: TestStateOkSync = () => {
      const state = st.ros(ok(1));
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 0);
    });
    describe("Then", async function () {
      await test_state_then(maker, 0);
    });
    it("Get", async function () {
      await test_state_get(maker);
    });
    it("GetOk", async function () {
      await test_state_get_ok(maker);
    });
  });
  //##################################################################################################################################################
  describe("RES", { timeout: 100 }, function () {
    it("ok", async function () {
      st.res(ok(1));
    });
    it("err", async function () {
      st.res(err("1"));
    });
    const maker: TestStateSync = () => {
      const state = st.res(ok(1));
      const set = (val: StateResult<number>) => state.set(val);
      return { o: false, s: true, w: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 0);
    });
    describe("Then", async function () {
      await test_state_then(maker, 0);
    });
    it("Get", async function () {
      await test_state_get(maker);
    });
  });
  //##################################################################################################################################################
  describe("ROSWS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.rosw(ok(1), true);
    });
    const maker: TestStateOkSync = () => {
      const state = st.rosw(ok(1), true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: true, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 0);
    });
    describe("Then", async function () {
      await test_state_then(maker, 0);
    });
    it("Get", async function () {
      await test_state_get(maker);
    });
    it("GetOk", async function () {
      await test_state_get_ok(maker);
    });
    const maker_write: TestStateWrite = () => {
      const state = st.rosw(ok(1), true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
  //##################################################################################################################################################
  describe("RESWS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.resw(ok(1), true);
    });
    it("err", async function () {
      st.resw(err("1"), true);
    });
    const maker: TestStateSync = () => {
      const state = st.resw(ok(1), true);
      const set = (val: StateResult<number>) => state.set(val);
      return { o: false, s: true, w: true, state, set };
    };
    it("Test Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 0);
    });
    describe("Test Then", async function () {
      await test_state_then(maker, 0);
    });
    it("Get", async function () {
      await test_state_get(maker);
    });
    const maker_write: TestStateWrite = () => {
      const state = st.resw(ok(1), true);
      const set = (val: StateResult<number>) => state.set(val);
      return { o: false, s: true, w: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
});
