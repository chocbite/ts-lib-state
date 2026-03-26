import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { assertType, describe, it } from "vitest";
import {
  state as st,
  StateREA,
  StateResourceFuncREA,
  StateResourceFuncREAW,
  StateResourceFuncROA,
  StateResourceFuncROAW,
  StateROA,
  StateROAW,
} from "..";
import {
  test_state_sub,
  test_state_then,
  type TestStateAll,
  type TestStateOk,
  type TestStateWrite,
} from "./tests_shared";

describe("Resource states", function () {
  //##################################################################################################################################################
  //      _____   ____
  //     |  __ \ / __ \   /\
  //     | |__) | |  | | /  \
  //     |  _  /| |  | |/ /\ \
  //     | | \ \| |__| / ____ \
  //     |_|  \_\\____/_/    \_\
  describe("ROA", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.roa.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateROA<number>>(init);
      assertType<StateResourceFuncROA<number>>(init);
    });
    const maker: TestStateOk = () => {
      let val: ResultOk<number> = ok(1);
      const state = st.r.roa.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: ResultOk<number>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: true, s: false, w: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });
  //##################################################################################################################################################
  //      _____  ______
  //     |  __ \|  ____|   /\
  //     | |__) | |__     /  \
  //     |  _  /|  __|   / /\ \
  //     | | \ \| |____ / ____ \
  //     |_|  \_\______/_/    \_\
  describe("REA", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.rea.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateREA<number>>(init);
      assertType<StateResourceFuncREA<number>>(init);
    });
    const maker: TestStateAll = () => {
      let val: Result<number, string> = ok(1);
      const state = st.r.rea.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: Result<number, string>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: false, s: false, w: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });

  //##################################################################################################################################################
  //      _____   ____     __          __
  //     |  __ \ / __ \   /\ \        / /
  //     | |__) | |  | | /  \ \  /\  / /
  //     |  _  /| |  | |/ /\ \ \/  \/ /
  //     | | \ \| |__| / ____ \  /\  /
  //     |_|  \_\\____/_/    \_\/  \/
  describe("ROAW", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.roaw.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateROAW<number>>(init);
      assertType<StateResourceFuncROAW<number>>(init);
    });
    const maker: TestStateWrite = () => {
      let val: ResultOk<number> = ok(1);
      const state = st.r.roaw.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: ResultOk<number>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: true, s: false, w: true, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });

  //##################################################################################################################################################
  //      _____  ______     __          __
  //     |  __ \|  ____|   /\ \        / /
  //     | |__) | |__     /  \ \  /\  / /
  //     |  _  /|  __|   / /\ \ \/  \/ /
  //     | | \ \| |____ / ____ \  /\  /
  //     |_|  \_\______/_/    \_\/  \/
  describe("REAW", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.reaw.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateREA<number>>(init);
      assertType<StateResourceFuncREAW<number>>(init);
    });
    const maker: TestStateWrite = () => {
      let val: Result<number, string> = ok(1);
      const state = st.r.reaw.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: Result<number, string>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: false, s: false, w: true, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });
});
