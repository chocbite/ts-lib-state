# @chocbite/ts-lib-state

A type-safe, reactive state management library for TypeScript.

## Installation

```sh
npm install @chocbite/ts-lib-state
```

## Import

```ts
import { state as st } from '@chocbite/ts-lib-state';
```

---

## State type notation

States are named using short letter codes that describe their capabilities:

| Letter | Meaning |
|--------|---------|
| `R` | Readable |
| `W` | Writable |
| `O` | Read always returns `Ok` (no error) |
| `E` | Read may return an error |
| `S` | Synchronous read |
| `A` | Async on initial load; synchronous once resolved |
| `WS` | Synchronous write |
| `WA` | Asynchronous write |

Examples: `ROS` = Read-Only Sync Ok, `REAWS` = Read Error Async with Sync-Write.

---

## Sync / Lazy / Delayed states

### Sync states (`st.s`)

Values are available immediately and synchronously.

```ts
// Read-only, always-ok
const count = st.s.ros.ok(0);
count.get();      // { ok: true, value: 0 }
count.ok();       // 0

// Read-only, may error
const risky = st.s.res.ok(42);
const failed = st.s.res.err('Something went wrong');

// Writable (second argument enables external writes)
const mutable = st.s.ros_ws.ok(10, true);
mutable.write_sync(20);  // synchronous write
await mutable.write(30); // async write

// Writable with possible error
const mutErr = st.s.res_ws.ok(5, true);
await mutErr.write(99);

// Subscribe to changes
const unsub = count.sub((value) => {
  console.log('count changed:', value.value);
}, true); // true = call immediately with current value

unsub(); // stop listening
```

---

### Lazy states (`st.l`)

Same API as sync states, but the initial value is computed by a factory function that runs only on the first read. After evaluation the factory is cleaned up.

```ts
// Evaluated once on first access
const lazy = st.l.ros.ok(() => expensiveComputation());
lazy.ok();  // factory runs here, result is cached

// May error
const lazyErr = st.l.res.ok(() => maybeThrows());

// Writable lazy
const lazyMut = st.l.ros_ws.ok(() => 100, true);
await lazyMut.write(200);
```

---

### Delayed states (`st.d`)

The initial value is fetched asynchronously (e.g. from a server). Once the promise resolves the state behaves like a sync state: `get()`, `ok()`, and `then()` all return synchronously, and `rsync` becomes `true`.

```ts
// Always-ok delayed state – first access triggers the async init
const data = st.d.roa.ok(() => fetch('/api/value').then(r => r.json()));

// Await the first resolution
const result = await data; // { ok: true, value: ... }

// From here on, reads are synchronous
data.get();  // { ok: true, value: ... }
data.ok();   // the value directly

// May error on first load
const fallible = st.d.rea.ok(() => fetchMayFail());
const res = await fallible; // { ok: true, value: ... } or { ok: false, err: '...' }

// Writable with synchronous write (value available sync after first await)
const syncWrite = st.d.roa_ws.ok(() => loadFromServer(), true);
await syncWrite; // wait for initial load
syncWrite.write_sync(42); // synchronous write thereafter

// Writable with asynchronous write
const asyncWrite = st.d.roa_wa.ok(() => loadFromServer(), true);
await asyncWrite.write(42);

// Subscribe – callback fires once the value is resolved and on every subsequent update
const unsub = data.sub((value) => {
  console.log('data ready:', value.value);
});
```

---

## Proxy states (`st.p`)

A proxy wraps an existing state and applies a transform on read (and optionally on write). The proxy keeps in sync with its source automatically.

```ts
const base = st.s.ros.ok(5);

// Read-only proxy with a transform
const doubled = st.p.ros(base, (result) => ({ ok: true as const, value: result.value * 2 }));
doubled.ok(); // 10

// When the source changes, the proxy updates too
base.set_ok(7);
doubled.ok(); // 14

// Proxy over an async state
const asyncBase = st.d.roa.ok(() => Promise.resolve(3));
const asyncProxy = st.p.roa(asyncBase, (result) => ({ ok: true as const, value: result.value + 1 }));
const val = await asyncProxy; // { ok: true, value: 4 }

// Writable proxy – transform is applied on write before forwarding to source
const proxy = st.p.ros_ws(
  base,
  (result) => ({ ok: true as const, value: result.value * 2 }), // read transform
  (val) => val / 2,                                              // write transform
);
proxy.write_sync(20); // halved to 10 before writing to base
base.ok();            // 10

// Swap the source or the transform at any time
proxy.set_state(st.s.ros.ok(1));
proxy.set_transform_read((r) => ({ ok: true as const, value: r.value + 100 }));
```

---

## Collected states (`st.c`)

A collected state subscribes to multiple source states and reduces their current values into one derived value. It updates automatically whenever any source changes.

```ts
const x = st.s.ros.ok(3);
const y = st.s.ros.ok(4);

// Synchronous collected state (all sources are sync)
const sum = st.c.ros.from(
  (values) => values[0].value + values[1].value, // reducer
  x,
  y,
);
sum.ok(); // 7

x.set_ok(10);
sum.ok(); // 14

// May-error collected state
const a = st.s.res.ok(5);
const b = st.s.res.err('not ready');

const product = st.c.res.from(
  (values) => {
    for (const v of values) if (v.err) return v;           // propagate first error
    return { ok: true as const, value: values[0].value * values[1].value };
  },
  a,
  b,
);
product.get(); // { ok: false, err: 'not ready' }

// Async collected state (sources may be delayed/async)
const p = st.d.roa.ok(() => Promise.resolve(10));
const q = st.d.roa.ok(() => Promise.resolve(20));

const asyncSum = st.c.roa.from(
  (values) => ({ ok: true as const, value: values[0].value + values[1].value }),
  p,
  q,
);
const r = await asyncSum; // { ok: true, value: 30 }

// Subscribe to updates
const unsub = sum.sub((value) => {
  console.log('sum is now:', value.value);
});
```
