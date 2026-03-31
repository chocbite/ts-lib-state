import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const setter = state.rosw(state.a.help(ok([5])), async (val, s, o) => {
  if (state.a.is_write(val)) {
    state.a.read_set(state.a.write_apply(val, o?.value), (r) => {
      s.set(ok(r));
      s.set_ok(r);
    });
  } else {
    s.set_ok(val);
  }
  return ok(undefined);
});
console.debug(setter);

const test = state.rosw(state.a.help(ok([5])));
test.sub((v) => {
  console.warn(v.value);
}, true);
test.array.push(10);
test.array.change(0, 15);
test.array.change(1, 15);
