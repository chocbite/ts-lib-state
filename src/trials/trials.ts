import { ok } from "@chocbite/ts-lib-result";
import state, { StateNormalROS, StateNumberHelper } from "..";
import { ros } from "../normal";

let qwer: StateNormalROS<number, StateNumberHelper>;
qwer = state.ros(state.n.help(ok(5), { min: state.ok(0), max: state.ok(10) }));
qwer = state.ros(ok(5));

const zxcv = state.ros(ok(5));
console.warn(zxcv.helper);

const state_inst = state.ros(state.a.help(ok([5]), {}));

const jkl = ros(state.a.help(ok([5]), {}));
jkl.helper.related();

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

test.set_transform_read((v) => ok(9));

export const Themes = {
  Light: "light",
  Dark: "dark",
} as const;
export type Themes = (typeof Themes)[keyof typeof Themes];

const THEMES = state.enum.list<Themes>({
  [Themes.Light]: {
    name: "Light",
    description: "Theme optimized for daylight",
  },
  [Themes.Dark]: {
    name: "Dark",
    description: "Theme optimized for night time",
  },
});

const jkl2 = ros(
  state.enum.help(ok(Themes.Light as Themes), { list: state.ok(THEMES) }),
);
