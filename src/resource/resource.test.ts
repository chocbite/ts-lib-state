import { ok, ResultOk, type Result } from "@chocbite/ts-lib-result";
import { assertType, describe, it } from "vitest";
import {
  state as st,
  StateREA,
  StateResourceFuncREA,
  StateResourceFuncROA,
  StateROA,
} from "..";
import {
  test_state_sub,
  test_state_then,
  type TestStateAll,
  type TestStateOk,
  type TestStateWrite,
} from "../tests_shared";

describe("Resource states", function () {
  //##################################################################################################################################################
  //      _____   ____
  //     |  __ \ / __ \   /\
  //     | |__) | |  | | /  \
  //     |  _  /| |  | |/ /\ \
  //     | | \ \| |__| / ____ \
  //     |_|  \_\\____/_/    \_\
  describe("ROA", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.roa.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateROA<number>>(init);
      assertType<StateResourceFuncROA<number>>(init);
    });
    const maker: TestStateOk = () => {
      let val: ResultOk<number> = ok(1);
      const state = st.r.roa.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: ResultOk<number>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: true, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });
  //##################################################################################################################################################
  //      _____  ______
  //     |  __ \|  ____|   /\
  //     | |__) | |__     /  \
  //     |  _  /|  __|   / /\ \
  //     | | \ \| |____ / ____ \
  //     |_|  \_\______/_/    \_\
  describe("REA", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.rea.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateREA<number>>(init);
      assertType<StateResourceFuncREA<number>>(init);
    });
    const maker: TestStateAll = () => {
      let val: Result<number, string> = ok(1);
      const state = st.r.rea.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: Result<number, string>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: false, s: false, w: false, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });
  //##################################################################################################################################################
  //      _____  ______            __          __
  //     |  __ \|  ____|   /\      \ \        / /\
  //     | |__) | |__     /  \      \ \  /\  / /  \
  //     |  _  /|  __|   / /\ \      \ \/  \/ / /\ \
  //     | | \ \| |____ / ____ \      \  /\  / ____ \
  //     |_|  \_\______/_/    \_\      \/  \/_/    \_\
  describe("REA WA", { timeout: 500 }, function () {
    it("ok", async function () {
      const init = st.r.rea_wa.from<number>(
        () => {},
        () => {},
        () => {},
      );
      assertType<StateREA<number>>(init);
      assertType<StateResourceFuncREA<number>>(init);
    });
    const maker: TestStateWrite = () => {
      let val: Result<number, string> = ok(1);
      const state = st.r.rea_wa.from<number>(
        async (state) => state.update_single(val),
        () => {},
        () => {},
      );
      const set = (v: Result<number, string>) => {
        val = v;
        state.update_resource(v);
      };
      return { o: false, s: false, w: true, ws: false, state, set };
    };
    it("Subscribing And Unsubscribing", async function () {
      await test_state_sub(maker, 50);
    });
    describe("Then", async function () {
      await test_state_then(maker, 50);
    });
  });
});

// import { Err, Ok } from "@chocbite/ts-lib-result";
// import { describe, expect, it } from "vitest";
// import { state_resource } from "../resource";

// const generatePromises = (amount: number) => {
//   let promises: Promise<any>[] = [];
//   let fulfillments: ((value: any) => void)[] = [];
//   for (let i = 0; i < amount; i++) {
//     promises.push(
//       new Promise<any>((a) => {
//         fulfillments.push(a);
//       })
//     );
//   }
//   return {
//     promise: new Promise(async (a) => {
//       a(await Promise.all(promises));
//     }),
//     calls: fulfillments,
//   };
// };

// describe("Getting state value", { timeout: 50 }, async () => {
//   it("Async once fulfillment", async () => {
//     let { promise, calls } = generatePromises(2);
//     let state = state_resource<number>(
//       async () => {
//         calls[0](0);
//         return Ok(0);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     state.then((val) => {
//       if (val.ok) {
//         calls[1](0);
//       }
//     });
//     await promise;
//   });
//   it("Async once rejection", async () => {
//     let { promise, calls } = generatePromises(2);
//     let state = state_resource<number>(
//       async () => {
//         calls[0](0);
//         return Err({ code: "CL", reason: "Conn Lost" });
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     state.then((val) => {
//       if (val.err) {
//         calls[1](0);
//       }
//     });
//     await promise;
//   });
//   it("Using then with chaining return", async () => {
//     let state = state_resource<number>(
//       async () => {
//         return Ok(2);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     expect(
//       await state
//         .then((val) => {
//           expect(val.unwrap).equal(2);
//           return 8;
//         })
//         .then((val) => {
//           expect(val).equal(8);
//           return 12;
//         })
//     ).eq(12);
//   });
//   it("Using then with chaining throw", async () => {
//     let state = state_resource<number>(
//       async () => {
//         return Ok(2);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     expect(
//       await state
//         .then((val) => {
//           expect(val.unwrap).equal(2);
//           throw 8;
//         })
//         .then(
//           () => {},
//           (val) => {
//             expect(val).equal(8);
//             return 12;
//           }
//         )
//     ).eq(12);
//   });
//   it("Using then with async chaining return", async () => {
//     let state = state_resource<number>(
//       async () => {
//         return Ok(2);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     expect(
//       await state
//         .then(async (val) => {
//           await new Promise((a) => {
//             setTimeout(a, 10);
//           });
//           expect(val.unwrap).equal(2);
//           return 8;
//         })
//         .then((val) => {
//           expect(val).equal(8);
//           return 12;
//         })
//     ).eq(12);
//   });
//   it("Using then with async chaining throw", async () => {
//     let state = state_resource<number>(
//       async () => {
//         return Ok(2);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     expect(
//       await state
//         .then(async (val) => {
//           await new Promise((a) => {
//             setTimeout(a, 10);
//           });
//           expect(val.unwrap).equal(2);
//           throw 8;
//         })
//         .then(
//           () => {},
//           (val) => {
//             expect(val).equal(8);
//             return 12;
//           }
//         )
//     ).eq(12);
//   });
//   it("Awaiting async value", async () => {
//     let state = state_resource<number>(
//       async () => {
//         return Ok(2);
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     expect((await state).unwrap).equal(2);
//   });
// });

// describe("Async Setting value", { timeout: 50 }, function () {
//   it("From user context with no setter function", async () => {
//     await new Promise((done) => {
//       let state = state_resource<number>(
//         async () => {
//           return Ok(2);
//         },
//         () => {
//           throw new Error("This should not be called");
//         },
//         () => {
//           throw new Error("This should not be called");
//         },
//         50,
//         50,
//         50,
//         50,
//         async (_val) => {
//           done(0);
//           return Ok(undefined);
//         }
//       );
//       state.write(4);
//     });
//   });
// });

// describe("Async subscribe", { timeout: 50 }, function () {
//   it("Async subscribe", async () => {
//     let { promise, calls } = generatePromises(3);
//     let state = state_resource<number>(
//       async () => {
//         throw new Error("This should not be called");
//       },
//       (state) => {
//         calls[0](0);
//         state.updateResource(Ok(2));
//       },
//       () => {
//         throw new Error("This should not be called");
//       },
//       50,
//       50,
//       50
//     );
//     state.subscribe(() => {
//       calls[1](0);
//     }, true);
//     state.subscribe(() => {
//       calls[2](0);
//     }, true);
//     await promise;
//   });
//   it("Async unsubscribe", async () => {
//     let { promise, calls } = generatePromises(3);
//     let state = state_resource<number>(
//       async () => {
//         throw new Error("This should not be called");
//       },
//       (state) => {
//         calls[0](0);
//         state.updateResource(Ok(2));
//       },
//       () => {
//         calls[2](0);
//       },
//       50,
//       50,
//       50
//     );
//     let func = state.subscribe(() => {
//       calls[1](0);
//     }, true);
//     await new Promise((a) => {
//       setTimeout(a, 100);
//     });
//     state.unsubscribe(func);
//     await promise;
//   });
// });
