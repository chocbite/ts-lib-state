import { ok } from "@chocbite/ts-lib-result";
import state, { StateLocalROS, StateLocalROSW, StateROS, StateROSW } from "..";

//Setting variable
const _varrosw: StateLocalROSW<string> = state.rosw(ok("Hello world!"));
const _varrosw2: StateROSW<string> = state.rosw(ok("Hello world!"));
const _varrosw_ros: StateLocalROS<string> = state.rosw(ok("Hello world!"));
const _varrosw2_ros: StateROS<string> = state.rosw(ok("Hello world!"));
