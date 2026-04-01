# @chocbite/ts-lib-state

A type-safe state management library for TypeScript with support for synchronous/asynchronous, read-only/writable, and result-based states.

## Installation

```bash
npm install @chocbite/ts-lib-state
```

## Overview

The library classifies states along three axes:

- **Sync** — Synchronous (`ROS`, `RES`) or Asynchronous (`ROA`, `REA`)
- **Error** — Always OK (`ROS`, `ROA`) or Error-capable (`RES`, `REA`)
- **Write** — Read-only or Writable (`ROSW`, `ROAW`, `RESW`, `REAW`)

This gives eight state types that cover every combination:

| Type   | Sync | OK-only | Writable |
| ------ | ---- | ------- | -------- |
| `ROS`  | ✓    | ✓       |          |
| `ROSW` | ✓    | ✓       | ✓        |
| `RES`  | ✓    |         |          |
| `RESW` | ✓    |         | ✓        |
| `ROA`  |      | ✓       |          |
| `ROAW` |      | ✓       | ✓        |
| `REA`  |      |         |          |
| `REAW` |      |         | ✓        |

## Quick Start

```typescript
import state from "@chocbite/ts-lib-state";
import { ok } from "@chocbite/ts-lib-result";

// Create a writable, sync, ok-only state
const counter = state.ok_w(0);

// Subscribe to changes (true = call immediately with current value)
counter.sub((result) => {
  console.log("Count:", result.value);
}, true);

// Update the state
counter.write(ok(1));
counter.write(ok(2));

// Read the current value synchronously
console.log(counter.ok()); // 2
```

## Creating States

### Shorthand Factories

```typescript
state.ok(value); // ROS  — read-only, sync, always ok
state.ok_w(value); // ROSW — writable, sync, always ok
state.from(value); // RES  — read-only, sync, error-capable
state.from_w(value); // RESW — writable, sync, error-capable
state.err(message); // RES  — read-only, sync, starts with error
state.err_w(message); // RESW — writable, sync, starts with error
```

### Local States

For full control over initial values, use the lower-level local factories. Each accepts a `Result` value:

```typescript
import { ok, err } from "@chocbite/ts-lib-result";

const a = state.ros(ok(42)); // ROS
const b = state.rosw(ok(42)); // ROSW (owner returned with .set())
const c = state.res(ok(42)); // RES
const d = state.resw(err("n/a")); // RESW
```

Async local states accept getter/setter functions:

```typescript
const e = state.roa(async () => ok(await fetchData()));
const f = state.roaw(async () => ok(await fetchData()));
```

## Subscribing to State

```typescript
// Subscribe — callback receives a Result<T, string>
const unsub = counter.sub((result) => {
  if (result.ok) {
    console.log(result.value);
  }
});

// Unsubscribe
counter.unsub(unsub);

// Subscribe with immediate invocation
counter.sub(callback, true);

// Promise-style using then executes immidiatly
counter.then((result) => {
  console.log(result.value);
});
// Promise-style using await syntax execute in microloop
console.log((await counter).value);
```

## Collected States

Combine multiple states into a single derived state:

```typescript
const firstName = state.ok("Alice");
const lastName = state.ok("Smith");

const fullName = state.c.ros(
  (vals) => ok(`${vals[0].value} ${vals[1].value}`),
  firstName,
  lastName,
);
// fullName.ok() === "Alice Smith"
```

Available variants: `state.c.ros`, `state.c.roa`, `state.c.res`, `state.c.rea`.

## Proxy States

Wrap a state with read/write transformation functions or proxy its value:

```typescript
const source = state.ok_w(5);

// Read-only proxy that doubles the value
const doubled = state.p.ros(source, (val) => ok(val.value * 2));
// doubled.ok() === 10

// Writable proxy with bidirectional transforms
const offset = state.p.rosw(
  source,
  (val) => ok(val.value + 10), // read: add 10
  (val) => ok(val.value - 10), // write→inner: subtract 10
  (val) => ok(val.value + 10), // inner→write: add 10
);
```

## Remote States

Represent asynchronous remote resources:

```typescript
const userData = state.r.roa.from(async (owner) => {
  const data = await fetch("/api/user").then((r) => r.json());
  owner.update_single(ok(data));
});
```

Available variants: `state.r.roa`, `state.r.rea`, `state.r.roaw`, `state.r.reaw`.

## Helpers

### Array

States holding arrays get built-in mutation helpers:

```typescript
const list = state.rosw(ok([1, 2, 3]));

list.array.push(4); // [1, 2, 3, 4]
list.array.unshift(0); // [0, 1, 2, 3, 4]
list.array.pop(); // [0, 1, 2, 3]
list.array.shift(); // [1, 2, 3]
list.array.insert(1, [99]); // [1, 99, 2, 3]
list.array.remove(0, 1); // [99, 2, 3]
list.array.change(0, 50); // [50, 2, 3]
```

Each mutation is tracked with metadata (`added`, `removed`, `changed`, `fresh`).

### Object

States holding objects get field-level mutation helpers:

```typescript
const obj = state.rosw(ok({ a: 1, b: 2 }));

obj.object.set({ a: 10 }); // { a: 10, b: 2 }
obj.object.remove("b"); // { a: 10 }
```

Each mutation is tracked with metadata (`added`, `removed`, `changed`, `fresh`).

### Validators

Attach validation helpers for primitive types:

```typescript
state.n.help(0, 100, 1); // Number: min, max, step
state.s.help(/^[a-z]+$/); // String: regex pattern
state.e.help("a", "b", "c"); // Enum: allowed values
state.b.help(); // Boolean
```

## Type Guards

Check state types at runtime:

```typescript
state.is.state(obj); // Is any state?
state.is.ros(obj); // Is ROS?
state.is.rosw(obj); // Is ROSW?
state.is.res(obj); // Is RES?
// ... and so on for all eight types
```

## Utilities

```typescript
// Await the first emitted value from any state
const value = await state.u.await_value(myState);

// Compare any two state values for equality, returns a promise
const equal = state.u.compare(stateA, stateB);

// Compare two states sync state values
const equal = state.u.compare_sync(stateA, stateB);
```

## License

MIT
