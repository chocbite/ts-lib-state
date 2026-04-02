import { array_from_length } from "@chocbite/ts-lib-common";
import { ok } from "@chocbite/ts-lib-result";
import state from "..";

const sub_rows = state.rosw(
  state.a.help(ok(array_from_length(3, (i) => i))),
  true,
);
const length_prox_ros = state.p.ros(sub_rows.related().value.length, (len) =>
  ok(len.value >= 3),
);
const length_prox_res = state.p.res(sub_rows.related().value.length, (len) =>
  ok(len.value >= 3),
);
const length_prox_roa = state.p.roa(sub_rows.related().value.length, (len) =>
  ok(len.value >= 3),
);
const length_prox_rea = state.p.rea(sub_rows.related().value.length, (len) =>
  ok(len.value >= 3),
);

console.warn(
  length_prox_ros,
  length_prox_res,
  length_prox_roa,
  length_prox_rea,
);
