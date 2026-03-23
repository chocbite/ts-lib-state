import state from ".";

const state_inst = state.s.rosw.ok([5]);
state_inst.sub((v) => {
  console.warn(state.h.array.read(v.value));
}, true);
state_inst.set_ok([6]);
state_inst.write(state.h.array.push(7));
