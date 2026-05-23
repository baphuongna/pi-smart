import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  UsageTracker,
  createUsageTracker,
  getLifetimeTotal,
  addUsage,
  type LifetimeUsage,
  type UsageDelta,
} from "../../src/observability/usage-tracker.ts";

describe("UsageTracker", () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  describe("add()", () => {
    it("should add usage delta to total", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });

      const total = tracker.total;
      assert.equal(total.input, 100);
      assert.equal(total.output, 50);
      assert.equal(total.cacheWrite, 25);
    });

    it("should accumulate multiple additions", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });
      tracker.add({ input: 200, output: 100, cacheWrite: 50 });

      const total = tracker.total;
      assert.equal(total.input, 300);
      assert.equal(total.output, 150);
      assert.equal(total.cacheWrite, 75);
    });

    it("should track multiple messages", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });
      tracker.add({ input: 200, output: 100, cacheWrite: 50 });

      assert.equal(tracker.messageCount, 2);
    });
  });

  describe("total property", () => {
    it("should return a copy of usage (not reference)", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });

      const total1 = tracker.total;
      const total2 = tracker.total;

      // Modifying one should not affect the other
      total1.input = 999;
      assert.equal(tracker.total.input, 100);
    });

    it("should return zero for empty tracker", () => {
      const total = tracker.total;
      assert.equal(total.input, 0);
      assert.equal(total.output, 0);
      assert.equal(total.cacheWrite, 0);
    });
  });

  describe("tokens property", () => {
    it("should sum input and output tokens", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });

      assert.equal(tracker.tokens, 150); // 100 + 50
    });

    it("should not include cacheWrite in tokens", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 1000 });

      assert.equal(tracker.tokens, 150);
    });

    it("should return 0 for empty tracker", () => {
      assert.equal(tracker.tokens, 0);
    });
  });

  describe("average property", () => {
    it("should return null for empty tracker", () => {
      assert.equal(tracker.average, null);
    });

    it("should calculate correct average", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });
      tracker.add({ input: 200, output: 100, cacheWrite: 50 });

      const avg = tracker.average;
      assert.ok(avg !== null);
      // (100+200)/2=150, (50+100)/2=75, (25+50)/2=37.5 -> 38 (rounded)
      assert.equal(avg.input, 150);
      assert.equal(avg.output, 75);
      assert.equal(avg.cacheWrite, 38);
    });

    it("should round to nearest integer", () => {
      tracker.add({ input: 100, output: 100, cacheWrite: 0 });
      tracker.add({ input: 101, output: 101, cacheWrite: 0 });

      const avg = tracker.average;
      assert.ok(avg !== null);
      // (100 + 101) / 2 = 100.5 -> 101 (rounded)
      assert.equal(avg.input, 101);
    });
  });

  describe("clear()", () => {
    it("should reset all usage to zero", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });
      tracker.clear();

      const total = tracker.total;
      assert.equal(total.input, 0);
      assert.equal(total.output, 0);
      assert.equal(total.cacheWrite, 0);
      assert.equal(tracker.tokens, 0);
      assert.equal(tracker.messageCount, 0);
    });
  });

  describe("toJSON()", () => {
    it("should return serializable object", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });

      const json = tracker.toJSON();

      assert.ok(json.hasOwnProperty("total"));
      assert.ok(json.hasOwnProperty("tokens"));
      assert.ok(json.hasOwnProperty("messageCount"));
      assert.ok(json.hasOwnProperty("average"));

      // Should be JSON serializable
      const str = JSON.stringify(json);
      assert.ok(str.length > 0);
    });

    it("should reflect current state", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });
      const json = tracker.toJSON() as { tokens: number };

      assert.equal(json.tokens, 150);
    });
  });

  describe("messages property", () => {
    it("should return copy of messages array", () => {
      tracker.add({ input: 100, output: 50, cacheWrite: 25 });

      const messages = tracker.messages;
      assert.equal(messages.length, 1);
      assert.deepEqual(messages[0], { input: 100, output: 50, cacheWrite: 25 });

      // Modifying should not affect tracker
      messages.push({ input: 999, output: 999, cacheWrite: 999 });
      assert.equal(tracker.messageCount, 1);
    });
  });
});

describe("getLifetimeTotal", () => {
  it("should sum all usage components", () => {
    const usage: LifetimeUsage = { input: 100, output: 50, cacheWrite: 25 };
    assert.equal(getLifetimeTotal(usage), 175);
  });

  it("should return 0 for undefined", () => {
    assert.equal(getLifetimeTotal(undefined), 0);
  });

  it("should return 0 for empty usage", () => {
    assert.equal(getLifetimeTotal({ input: 0, output: 0, cacheWrite: 0 }), 0);
  });
});

describe("addUsage", () => {
  it("should add delta into target (mutates target)", () => {
    const target: LifetimeUsage = { input: 100, output: 50, cacheWrite: 25 };
    const delta: LifetimeUsage = { input: 50, output: 25, cacheWrite: 10 };

    addUsage(target, delta);

    assert.equal(target.input, 150);
    assert.equal(target.output, 75);
    assert.equal(target.cacheWrite, 35);
  });

  it("should handle zero delta", () => {
    const target: LifetimeUsage = { input: 100, output: 50, cacheWrite: 25 };

    addUsage(target, { input: 0, output: 0, cacheWrite: 0 });

    assert.equal(target.input, 100);
    assert.equal(target.output, 50);
    assert.equal(target.cacheWrite, 25);
  });
});

describe("createUsageTracker", () => {
  it("should create a new UsageTracker instance", () => {
    const tracker = createUsageTracker();
    assert.ok(tracker instanceof UsageTracker);
  });

  it("should return functional tracker", () => {
    const tracker = createUsageTracker();
    tracker.add({ input: 100, output: 50, cacheWrite: 25 });

    assert.equal(tracker.total.input, 100);
    assert.equal(tracker.tokens, 150);
  });
});
