import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const state_inst = state.rosw(state.a.help(ok([5])), async (val, s, o) => {
  if (state.a.is_write(val)) {
    state.a.read_set(state.a.write_apply(val, o?.value), (r) => {
      s.set(r);
      s.set_ok(ok(r));
    });
  } else {
    s.set_ok(val);
  }
  return ok(undefined);
});
