import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const state_inst = state.rosw(state.a.help(ok([5])));

state_inst.related().value.length.sub((v) => {
  console.warn(v);
}, true);

state_inst.sub((v) => {
  console.warn(v.value);
}, true);
state_inst.write(state.a.write.push(7));
state_inst.array.push(8);
