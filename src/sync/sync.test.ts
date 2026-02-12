import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { assertType, describe, it } from "vitest";
import { state as st, StateROS } from "..";
import {
  test_state_get,
  test_state_get_ok,
  test_state_sub,
  test_state_then,
  test_state_write,
  test_state_write_sync,
  type TestStateOkSync,
  type TestStateSync,
  type TestStateWriteSync,
} from "../tests_shared";

describe("Sync states", function () {
  describe("ROS", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.s.ros.ok(1);
      assertType<StateROS<number>>(init);
    });
    it("result ok", async function () {
      st.s.ros.result(ok(1));
    });
    const maker: TestStateOkSync = () => {
      const state = st.s.ros.ok(1);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: false, ws: false, state, set };
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
      st.s.res.ok(1);
    });
    it("err", async function () {
      st.s.res.err("1");
    });
    it("result ok", async function () {
      st.s.res.result(ok(1));
    });
    const maker: TestStateSync = () => {
      const state = st.s.res.ok(1);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: true, w: false, ws: false, state, set };
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
      st.s.ros_ws.ok(1, true);
    });
    it("result ok", async function () {
      st.s.ros_ws.result(ok(1), true);
    });
    const maker: TestStateOkSync = () => {
      const state = st.s.ros_ws.ok(1, true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: true, ws: true, state, set };
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
    const maker_write: TestStateWriteSync = () => {
      const state = st.s.ros_ws.ok(1, true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: true, ws: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
    it("WriteSync", async function () {
      await test_state_write_sync(maker_write);
    });
  });
  //##################################################################################################################################################
  describe("RESWS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.s.res_ws.ok(1, true);
    });
    it("err", async function () {
      st.s.res_ws.err("1", true);
    });
    it("result ok", async function () {
      st.s.res_ws.result(ok(1), true);
    });
    const maker: TestStateSync = () => {
      const state = st.s.res_ws.ok(1, true);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: true, w: true, ws: true, state, set };
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
    const maker_write: TestStateWriteSync = () => {
      const state = st.s.res_ws.ok(1, true);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: true, w: true, ws: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
    it("WriteSync", async function () {
      await test_state_write_sync(maker_write);
    });
  });
});
