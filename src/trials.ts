import state, { StateEnumRelated } from ".";

const state_inst = state.s.ros_ws.ok(
  5,
  true,
  state.h.nums.helper(state.ok(0), state.ok(10)),
);
state_inst.write(11);
console.warn(await state_inst);

state_inst.write(-11);

async function yoyo(related: Partial<StateEnumRelated>) {
  if (related.list) {
    const list = await related.list;
    if (list.ok) {
      const yo = state.h.enums.map(list.value, (k, v) => {
        return { key: "lol", val: v.icon };
      });
    }
  }
}
