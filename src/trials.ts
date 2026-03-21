import state from ".";

const state_inst = state.s.ros.ok([5]);
const test = state_inst.get().value;
console.warn(test);

test.push(6);
console.warn(state_inst.get().value);
state_inst.get();
