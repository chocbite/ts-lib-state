import { ok, ResultOk } from "@chocbite/ts-lib-result";
import state from "..";

const ros = state.c.ros(
  (v) => ok(String(v[0].value) + v[1].unwrap_or("default")),
  state.ok(1),
  state.err<string>("1"),
);

const roa = state.c.roa(
  (v) => ok(String(v[0].value) + v[1].unwrap_or("default")),
  state.ok(1),
  state.err<string>("1"),
  state.roa<ResultOk<number>>(undefined),
);

const res = state.c.res(
  (v) => ok(String(v[0].value) + v[1].unwrap_or("default")),
  state.ok(1),
  state.err<string>("1"),
);

const rea = state.c.rea(
  (v) => ok(String(v[0].value) + v[1].unwrap_or("default")),
  state.ok(1),
  state.err<string>("1"),
  state.roa<ResultOk<number>>(undefined),
);
