import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const state_inst = state.rosw(state.o.help(ok({ a: 5 })));

state_inst.sub((v) => {
  console.warn(v.value);
}, true);
state_inst.write(state.o.write.add({ c: 10 }));
state_inst.object.add("b", 10);
