import { sleep } from "@chocbite/ts-lib-common";
import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { describe, expect, it } from "vitest";
import { state as st } from "..";
import {
  test_state_get,
  test_state_get_ok,
  test_state_sub,
  test_state_then,
  type TestStateAll,
  type TestStateOk,
  type TestStateOkSync,
  type TestStateSync,
} from "./tests_shared";

describe("Collected states", function () {
  //##################################################################################################################################################
  //      _____   ____   _____
  //     |  __ \ / __ \ / ____|
  //     | |__) | |  | | (___
  //     |  _  /| |  | |\___ \
  //     | | \ \| |__| |____) |
  //     |_|  \_\\____/|_____/
  describe("ROS", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.c.ros((val) => val[0], st.ok(1));
      expect(init).instanceOf(st.c.class);
    });
    const maker_single: TestStateOkSync = () => {
      const stat1 = st.ok(1);
      const state = st.c.ros((val) => val[0], stat1);
      const set = (val: ResultOk<number>) => {
        stat1.set_ok(val.value);
      };
      return { o: true, s: true, w: false, state, set };
    };
    it("Single Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_single, 0);
    });
    describe("Single Then", async function () {
      await test_state_then(maker_single, 0);
    });
    it("Single Get", async function () {
      await test_state_get(maker_single);
    });
    it("Single GetOk", async function () {
      await test_state_get_ok(maker_single);
    });
    const maker_multiple: TestStateOkSync = () => {
      const stat1 = st.ok(0.25);
      const stat2 = st.ok(0.25);
      const stat3 = st.ok(0.25);
      const stat4 = st.ok(0.25);
      const state = st.c.ros(
        (val) => ok(val[0].value + val[1].value + val[2].value + val[3].value),
        stat1,
        stat2,
        stat3,
        stat4,
      );
      const set = (val: ResultOk<number>) => {
        stat1.set_ok(val.value / 4);
        stat2.set_ok(val.value / 4);
        stat3.set_ok(val.value / 4);
        stat4.set_ok(val.value / 4);
      };
      return { o: true, s: true, w: false, state, set };
    };
    it("Multiple Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_multiple, 0);
    });
    describe("Multiple Then", async function () {
      await test_state_then(maker_multiple, 0);
    });
    it("Multiple Get", async function () {
      await test_state_get(maker_multiple);
    });
    it("Multiple GetOk", async function () {
      await test_state_get_ok(maker_multiple);
    });
  });
  //##################################################################################################################################################
  //      _____  ______  _____
  //     |  __ \|  ____|/ ____|
  //     | |__) | |__  | (___
  //     |  _  /|  __|  \___ \
  //     | | \ \| |____ ____) |
  //     |_|  \_\______|_____/
  describe("RES", { timeout: 100 }, function () {
    it("ok", async function () {
      const init = st.c.res((val) => val[0], st.from(1));
      expect(init).instanceOf(st.c.class);
    });
    const maker_single: TestStateSync = () => {
      const stat1 = st.from(1);
      const state = st.c.res((val) => val[0], stat1);
      const set = (val: Result<number, string>) => {
        stat1.set(val.map((v) => v));
      };
      return { o: false, s: true, w: false, state, set };
    };
    it("Single Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_single, 0);
    });
    describe("Single Then", async function () {
      await test_state_then(maker_single, 0);
    });
    it("Single Get", async function () {
      await test_state_get(maker_single);
    });
    const maker_multiple: TestStateSync = () => {
      const stat1 = st.from(0.25);
      const stat2 = st.from(0.25);
      const stat3 = st.from(0.25);
      const stat4 = st.from(0.25);
      const state = st.c.res(
        (values) => {
          let sum = 0;
          for (const val of values) {
            if (val.err) return val;
            sum += val.value;
          }
          return ok(sum);
        },
        stat1,
        stat2,
        stat3,
        stat4,
      );
      const set = (val: Result<number, string>) => {
        stat1.set(val.map((v) => v / 4));
        stat2.set(val.map((v) => v / 4));
        stat3.set(val.map((v) => v / 4));
        stat4.set(val.map((v) => v / 4));
      };
      return { o: false, s: true, w: false, state, set };
    };
    it("Multiple Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_multiple, 0);
    });
    describe("Multiple Then", async function () {
      await test_state_then(maker_multiple, 0);
    });
    it("Multiple Get", async function () {
      await test_state_get(maker_multiple);
    });
  });
  //##################################################################################################################################################
  //      _____   ____
  //     |  __ \ / __ \   /\
  //     | |__) | |  | | /  \
  //     |  _  /| |  | |/ /\ \
  //     | | \ \| |__| / ____ \
  //     |_|  \_\\____/_/    \_\
  describe("ROA", { timeout: 200 }, function () {
    it("ok", async function () {
      const init = st.c.roa(
        (val) => val[0],
        st.roa(() => sleep(1, ok(1))),
      );
      expect(init).instanceOf(st.c.class);
    });
    const maker_single: TestStateOk = () => {
      const stat1 = st.roa(() => sleep(1, ok(1)));
      const state = st.c.roa((val) => val[0], stat1);
      const set = (val: ResultOk<number>) => {
        stat1.set_ok(val.value);
      };
      return { o: true, s: false, w: false, state, set };
    };
    it("Single Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_single, 50);
    });
    describe("Single Then", async function () {
      await test_state_then(maker_single, 50);
    });
    const maker_multiple: TestStateOk = () => {
      const stat1 = st.roa(() => sleep(1, ok(0.25)));
      const stat2 = st.roa(() => sleep(1, ok(0.25)));
      const stat3 = st.roa(() => sleep(1, ok(0.25)));
      const stat4 = st.roa(() => sleep(1, ok(0.25)));
      const state = st.c.roa(
        (val) => ok(val[0].value + val[1].value + val[2].value + val[3].value),
        stat1,
        stat2,
        stat3,
        stat4,
      );
      const set = (val: ResultOk<number>) => {
        stat1.set_ok(val.value / 4);
        stat2.set_ok(val.value / 4);
        stat3.set_ok(val.value / 4);
        stat4.set_ok(val.value / 4);
      };
      return { o: true, s: false, w: false, state, set };
    };
    it("Multiple Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_multiple, 50);
    });
    describe("Multiple Then", async function () {
      await test_state_then(maker_multiple, 50);
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
      const init = st.c.rea(
        (val) => val[0],
        st.rea(() => sleep(1, ok(1))),
      );
      expect(init).instanceOf(st.c.class);
    });
    const maker_single: TestStateAll = () => {
      const stat1 = st.rea(() => sleep(1, ok(1)));
      const state = st.c.rea((values) => values[0], stat1);
      const set = (val: Result<number, string>) => {
        stat1.set(val.map((v) => v));
      };
      return { o: false, s: false, w: false, state, set };
    };
    it("Single Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_single, 50);
    });
    describe("Single Then", async function () {
      await test_state_then(maker_single, 50);
    });
    const maker_multiple: TestStateAll = () => {
      const stat1 = st.rea(() => sleep(1, ok(0.25)));
      const stat2 = st.rea(() => sleep(1, ok(0.25)));
      const stat3 = st.rea(() => sleep(1, ok(0.25)));
      const stat4 = st.rea(() => sleep(1, ok(0.25)));
      const state = st.c.rea(
        (values) => {
          let sum = 0;
          for (const val of values) {
            if (val.err) return val;
            sum += val.value;
          }
          return ok(sum);
        },
        stat1,
        stat2,
        stat3,
        stat4,
      );
      const set = (val: Result<number, string>) => {
        stat1.set(val.map((v) => v / 4));
        stat2.set(val.map((v) => v / 4));
        stat3.set(val.map((v) => v / 4));
        stat4.set(val.map((v) => v / 4));
      };
      return { o: false, s: false, w: false, state, set };
    };
    it("Multiple Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker_multiple, 50);
    });
    describe("Multiple Then", async function () {
      await test_state_then(maker_multiple, 50);
    });
  });
});
