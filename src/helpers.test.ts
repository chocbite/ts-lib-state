import { err } from "@chocbite/ts-lib-result";
import { describe, expect, it } from "vitest";
import { state as st } from "..";

//##################################################################################################################################################
//      _   _ _    _ __  __ ____  ______ _____
//     | \ | | |  | |  \/  |  _ \|  ____|  __ \
//     |  \| | |  | | \  / | |_) | |__  | |__) |
//     | . ` | |  | | |\/| |  _ <|  __| |  _  /
//     | |\  | |__| | |  | | |_) | |____| | \ \
//     |_| \_|\____/|_|  |_|____/|______|_|  \_\
describe("State Number Min Max", async () => {
  it("Checking limiter min max", async () => {
    const state_inst = st.s.ros_ws.ok(5, true, st.h.nums.helper(0, 10));
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.limit(11).unwrap).to.equal(10);
    expect(state_inst.limit(-11).unwrap).to.equal(0);
    state_inst.write(11);
    expect((await state_inst).unwrap).to.equal(10);
    state_inst.write(-11);
    expect((await state_inst).unwrap).to.equal(0);
  });
  it("Checking checker min max", async () => {
    const state_inst = st.s.ros_ws.ok(5, true, st.h.nums.helper(0, 10));
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.check(11)).toEqual(
      err("11 is bigger than the limit of 10"),
    );
    expect(state_inst.check(-11)).toEqual(
      err("-11 is smaller than the limit of 0"),
    );
  });
  it("Checking related min max", async () => {
    const state_inst = st.s.ros_ws.ok(5, true, st.h.nums.helper(0, 10));
    const related = state_inst.related().unwrap;
    expect(related.min).to.equal(0);
    expect(related.max).to.equal(10);
  });
});
describe("State Number Unit", async () => {
  it("Checking related unit", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, "test"),
    );
    const related = state_inst.related().unwrap;
    expect(related.unit).to.equal("test");
  });
});
describe("State Number decimals", async () => {
  it("Checking related decimals", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, undefined, 2),
    );
    const related = state_inst.related().unwrap;
    expect(related.decimals).to.equal(2);
  });
  it("Checking limiter decimals step", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, undefined, 1, 0.13),
    );
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.limit(11).unwrap).to.equal(11.1);
    expect(state_inst.limit(-11).unwrap).to.equal(-11.1);
    state_inst.write(11);
    expect((await state_inst).unwrap).to.equal(11.1);
    state_inst.write(-11);
    expect((await state_inst).unwrap).to.equal(-11.1);
  });
  it("Checking limiter decimals step start", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, undefined, 3, 0.003, 0.07),
    );
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.limit(11).unwrap).to.equal(10.999);
    expect(state_inst.limit(-11).unwrap).to.equal(-11);
    state_inst.write(11);
    expect((await state_inst).unwrap).to.equal(10.999);
    state_inst.write(-11);
    expect((await state_inst).unwrap).to.equal(-11);
  });
});
describe("State Number step start", async () => {
  it("Checking limiter step", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, undefined, undefined, 0.13),
    );
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.limit(11).unwrap).to.equal(11.05);
    expect(state_inst.limit(-11).unwrap).to.equal(-11.05);
    state_inst.write(11);
    expect((await state_inst).unwrap).to.equal(11.05);
    state_inst.write(-11);
    expect((await state_inst).unwrap).to.equal(-11.05);
  });
  it("Checking limiter step start", async () => {
    const state_inst = st.s.ros_ws.ok(
      5,
      true,
      st.h.nums.helper(undefined, undefined, undefined, undefined, 0.13, 0.02),
    );
    expect((await state_inst).unwrap).to.equal(5);
    expect(state_inst.limit(11).unwrap).to.equal(10.94);
    expect(state_inst.limit(-11).unwrap).to.equal(-11.03);
    state_inst.write(11);
    expect((await state_inst).unwrap).to.equal(10.94);
    state_inst.write(-11);
    expect((await state_inst).unwrap).to.equal(-11.03);
  });
});
//##################################################################################################################################################
//       _____ _______ _____  _____ _   _  _____
//      / ____|__   __|  __ \|_   _| \ | |/ ____|
//     | (___    | |  | |__) | | | |  \| | |  __
//      \___ \   | |  |  _  /  | | | . ` | | |_ |
//      ____) |  | |  | | \ \ _| |_| |\  | |__| |
//     |_____/   |_|  |_|  \_\_____|_| \_|\_____|
describe("State String Max Len", async () => {
  it("Checking limiter max len", async () => {
    const state_inst = st.s.ros_ws.ok("5", true, st.h.strings.helper(10));
    expect((await state_inst).unwrap).to.equal("5");
    expect(state_inst.limit("12345678901").unwrap).to.equal("1234567890");
    state_inst.write("12345678901");
    expect((await state_inst).unwrap).to.equal("1234567890");
  });
  it("Checking checker max len", async () => {
    const state_inst = st.s.ros_ws.ok("5", true, st.h.strings.helper(10));
    expect((await state_inst).unwrap).to.equal("5");
    expect(state_inst.check("123456789012")).toEqual(
      err("the text is longer than the limit of 10 characters"),
    );
  });
  it("Checking related max len", async () => {
    const state_inst = st.s.ros_ws.ok("5", true, st.h.strings.helper(10));
    const related = state_inst.related().unwrap;
    expect(related.max_length).to.equal(10);
  });
});

describe("State String Max Byte Len", async () => {
  it("Checking limiter max byte len", async () => {
    const state_inst = st.s.ros_ws.ok(
      "5",
      true,
      st.h.strings.helper(undefined, 10),
    );
    expect((await state_inst).unwrap).to.equal("5");
    expect(state_inst.limit("1æøåæ01").unwrap).to.equal("1æøåæ0");
    state_inst.write("1æøåæ01");
    expect((await state_inst).unwrap).to.equal("1æøåæ0");
  });
  it("Checking checker max byte len", async () => {
    const state_inst = st.s.ros_ws.ok(
      "5",
      true,
      st.h.strings.helper(undefined, 10),
    );
    expect((await state_inst).unwrap).to.equal("5");
    expect(state_inst.check("1æøåæ01")).toEqual(
      err("the text is longer than the limit of 10 bytes"),
    );
  });
  it("Checking related max byte len", async () => {
    const state_inst = st.s.ros_ws.ok(
      "5",
      true,
      st.h.strings.helper(undefined, 10),
    );
    const related = state_inst.related().unwrap;
    expect(related.max_length_bytes).to.equal(10);
  });
});
