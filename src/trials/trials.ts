import state from "..";
import "./viewer";

console.debug("asdf");

const yo = state.ok<any>(new Date());
console.warn(await yo.to_json());
yo.set_ok({ a: 1, b: 2 });
console.warn(await yo.to_json());
