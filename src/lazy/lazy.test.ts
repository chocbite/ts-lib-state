import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { describe, expect, it } from "vitest";
import { state as st } from "..";
import {
  test_state_get,
  test_state_get_ok,
  test_state_sub,
  test_state_then,
  test_state_write,
  TestStateWrite,
  type TestStateOkSync,
  type TestStateSync,
} from "../tests_shared";

describe("Initialize lazy states", function () {
  describe("ROS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.l.ros.ok(() => 1);
    });
    it("result ok", async function () {
      st.l.ros.result(() => ok(1));
    });
    it("cleanup successfull", async function () {
      const init = st.l.ros.result(() => ok(1));
      const get = init.get;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      await init;
      expect(init.get).not.eq(get, "get");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
    });
    const maker: TestStateOkSync = () => {
      const state = st.l.ros.ok(() => 1);
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
      st.l.res.ok(() => 1);
    });
    it("err", async function () {
      st.l.res.err(() => "1");
    });
    it("result ok", async function () {
      st.l.res.result(() => ok(1));
    });
    it("cleanup successfull", async function () {
      const init = st.l.res.result(() => ok(1));
      const get = init.get;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      await init;
      expect(init.get).not.eq(get, "get");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
    });
    const maker: TestStateSync = () => {
      const state = st.l.res.ok(() => 1);
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
  describe("ROS_WS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.l.ros_ws.ok(() => 1);
    });
    it("result ok", async function () {
      st.l.ros_ws.result(() => ok(1));
    });
    it("cleanup successfull", async function () {
      const init = st.l.ros_ws.ok(() => 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.write).not.eq(write, "write");
    });
    const maker: TestStateOkSync = () => {
      const state = st.l.ros_ws.ok(() => 1);
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
    const maker_write: TestStateWrite = () => {
      const state = st.l.ros_ws.ok(() => 1, true);
      const set = (val: ResultOk<number>) => state.set(val);
      return { o: true, s: true, w: true, ws: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
  //##################################################################################################################################################
  describe("RES_WS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.l.res_ws.ok(() => 1);
    });
    it("err", async function () {
      st.l.res_ws.err(() => "1");
    });
    it("result ok", async function () {
      st.l.res_ws.result(() => ok(1));
    });
    it("cleanup successfull", async function () {
      const init = st.l.res_ws.ok(() => 1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const set = init.set;
      const write = init.write;
      await init;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(init.set).not.eq(set, "set");
      expect(init.write).not.eq(write, "write");
    });
    const maker: TestStateSync = () => {
      const state = st.l.res_ws.ok(() => 1);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: true, w: true, ws: true, state, set };
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
    const maker_write: TestStateWrite = () => {
      const state = st.l.res_ws.ok(() => 1, true);
      const set = (val: Result<number, string>) => state.set(val);
      return { o: false, s: true, w: true, ws: true, state, set };
    };
    it("Write", async function () {
      await test_state_write(maker_write);
    });
  });
});
