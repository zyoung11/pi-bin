// describe/it nesting: suite bodies run at registration, results indent
// two spaces per level, suites count separately from tests, and the
// before/beforeEach/afterEach/after hooks run in Node's order — the
// counters are ASSERTED inside tests (hook output would race Node's
// async reporter), never printed.
import assert from "node:assert";
import { describe, it, before, beforeEach, afterEach, after } from "node:test";

let beforeRan = 0;
let eachRan = 0;
let afterEachRan = 0;

describe("outer", () => {
  before(() => {
    beforeRan++;
  });
  beforeEach(() => {
    eachRan++;
  });
  afterEach(() => {
    afterEachRan++;
  });
  after(() => {});

  it("sees the before hook", () => {
    assert.strictEqual(beforeRan, 1);
    assert.strictEqual(eachRan, 1);
    assert.strictEqual(afterEachRan, 0);
  });

  it("sees beforeEach again", () => {
    assert.strictEqual(beforeRan, 1);
    assert.strictEqual(eachRan, 2);
    assert.strictEqual(afterEachRan, 1);
  });

  describe("inner", () => {
    it("nests two levels", () => {
      assert.ok(true);
    });
  });
});

describe("second suite", () => {
  it("still runs", () => {});
});
