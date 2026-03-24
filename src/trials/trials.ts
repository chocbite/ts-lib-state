import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const state_inst = state.s.rosw.ok([5]);

state_inst.sub((v) => {
  console.warn(v.value);
}, true);
state_inst.sub((v) => {
  console.warn(state.a.read(v.value));
}, true);
state_inst.set_ok([6]);
//state_inst.write(state.a.write.push(7));

state_inst.array.push(8);

const test = state.p.ros(state_inst, (v) => ok(v.unwrap()[0]));
test.sub((v) => {
  console.warn(v.value);
}, true);

test.set_transform_read((v) => ok(8));
