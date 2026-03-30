import { ok } from "@chocbite/ts-lib-result";
import state, { STATE_ARRAY_READ_KEY, StateRES, StateROS } from "..";
import { StateReadType } from "../types";

const state_inst = state.rosw(state.a.help(ok([5])));

state_inst.related().value.length.sub((v) => {
  console.warn(v);
}, true);

state_inst.sub((v) => {
  console.warn(v.value);
}, true);
state_inst.write(state.a.write.push(7));
state_inst.array.push(8);

const testa = state.ok([5]);
testa.ok()[STATE_ARRAY_READ_KEY];
const testb = state.p.ros(testa.read_only);
testb.ok()[STATE_ARRAY_READ_KEY];
testa.state;

type TEST<
  S extends StateRES<RIN, any, any>,
  RIN = S extends StateROS<infer RT> ? RT : never,
> = RIN;

const zxcv = {} as TEST<typeof state_inst>;

type YOYO = StateReadType<number[]>;
