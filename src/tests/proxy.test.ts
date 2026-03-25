import { ResultOk, type Result } from "@chocbite/ts-lib-result";
import { describe, it } from "vitest";
import { state as st } from "..";
import {
  test_state_get,
  test_state_get_ok,
  test_state_sub,
  test_state_then,
  type TestStateOkSync,
  type TestStateSync,
} from "./tests_shared";

describe("Proxy with sync states", function () {
  describe("ROS", { timeout: 100 }, function () {
    it("ok", async function () {
      st.p.ros(st.ok(1));
    });
    const maker: TestStateOkSync = () => {
      const stat = st.ok(1);
      const state = st.p.ros(stat);
      const set = (val: ResultOk<number>) => stat.set(val);
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
      st.p.res(st.ok(1));
    });
    const maker: TestStateSync = () => {
      const stat = st.s.res.ok(1);
      const state = st.p.res(stat);
      const set = (val: Result<number, string>) => stat.set(val);
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
});
