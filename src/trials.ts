import state from ".";

const state_inst = state.s.ros_ws.ok(
  5,
  true,
  state.h.nums.helper(state.ok(0), state.ok(10)),
);
state_inst.write(11);
console.warn(await state_inst);

state_inst.write(-11);
