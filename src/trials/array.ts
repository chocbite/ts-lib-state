import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const state_inst = state.rosw(state.a.help(ok([5])), async (val) => {
  if (state.a.is_write(val)) {
  } else {
    val;
  }
  return ok(undefined);
});

state_inst.sub((v) => {
  console.warn(v.value);
}, true);
state_inst.write(state.o.write.add({ c: 10 }));
state_inst.object.add(4, 10);
