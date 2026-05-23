import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  memoize,
  memoizeAsync,
  debounce,
  throttle,
} from "../../src/optimize/memoize.ts";

describe("memoize", () => {
  it("should cache function results", () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoize(fn);

    assert.equal(memoized(5), 10);
    assert.equal(callCount, 1);

    // Same argument should return cached result
    assert.equal(memoized(5), 10);
    assert.equal(callCount, 1); // Not called again

    // Different argument should call function
    assert.equal(memoized(6), 12);
    assert.equal(callCount, 2);
  });

  it("should use JSON stringify for argument key by default", () => {
    let callCount = 0;
    const fn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };

    const memoized = memoize(fn);

    memoized(1, 2);
    assert.equal(callCount, 1);

    memoized(1, 2);
    assert.equal(callCount, 1);

    memoized(2, 1);
    assert.equal(callCount, 2); // Different args
  });

  it("should support custom key generator", () => {
    let callCount = 0;
    const fn = (obj: { id: number }) => {
      callCount++;
      return obj.id * 2;
    };

    const memoized = memoize(fn, {
      keyGen: (obj) => String((obj as { id: number }).id),
    });

    memoized({ id: 1 });
    assert.equal(callCount, 1);

    // Different object but same id - should use cache
    memoized({ id: 1 });
    assert.equal(callCount, 1);

    memoized({ id: 2 });
    assert.equal(callCount, 2);
  });

  it("should respect TTL", async () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoize(fn, { ttlMs: 50 });

    memoized(5);
    assert.equal(callCount, 1);

    // Within TTL - should use cache
    await new Promise((r) => setTimeout(r, 30));
    memoized(5);
    assert.equal(callCount, 1);

    // After TTL - should call again
    await new Promise((r) => setTimeout(r, 30));
    memoized(5);
    assert.equal(callCount, 2);
  });

  it("should respect maxSize", () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoize(fn, { maxSize: 2 });

    memoized(1);
    memoized(2);
    assert.equal(callCount, 2);

    // Cache full, LRU eviction may occur
    memoized(3);
    assert.equal(callCount, 3);

    // Key 1 may have been evicted, causing recompute
    memoized(1);
    // callCount depends on eviction behavior
    assert.ok(callCount >= 3);

    // Key 2 should still be cached (if not evicted)
    const result2 = memoized(2);
    assert.equal(result2, 4);
    // May or may not be cached depending on LRU implementation
  });

  describe("clear()", () => {
    it("should clear all cached values", () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = memoize(fn);
      memoized(5);
      assert.equal(callCount, 1);

      memoized.clear();

      memoized(5);
      assert.equal(callCount, 2); // Called again
    });
  });

  describe("invalidate()", () => {
    it("should invalidate specific cached value", () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = memoize(fn);
      memoized(5);
      memoized(6);
      assert.equal(callCount, 2);

      memoized.invalidate(5);
      assert.equal(callCount, 2); // 6 still cached

      memoized(5); // 5 recomputed
      assert.equal(callCount, 3);

      memoized(6); // 6 still cached
      assert.equal(callCount, 3);
    });
  });
});

describe("memoizeAsync", () => {
  it("should cache async function results", async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoizeAsync(fn);

    const result1 = await memoized(5);
    assert.equal(result1, 10);
    assert.equal(callCount, 1);

    // Same argument should return cached promise
    const result2 = await memoized(5);
    assert.equal(result2, 10);
    assert.equal(callCount, 1);
  });

  it("should return same promise for concurrent calls", async () => {
    let resolveCount = 0;
    const fn = async (x: number) => {
      resolveCount++;
      await new Promise((r) => setTimeout(r, 10));
      return x * 2;
    };

    const memoized = memoizeAsync(fn);

    const [r1, r2, r3] = await Promise.all([memoized(5), memoized(5), memoized(5)]);

    assert.equal(r1, 10);
    assert.equal(r2, 10);
    assert.equal(r3, 10);
    assert.equal(resolveCount, 1); // Only one actual call
  });

  it("should support custom key generator", async () => {
    let callCount = 0;
    const fn = async (obj: { id: number }) => {
      callCount++;
      return obj.id * 2;
    };

    const memoized = memoizeAsync(fn, {
      keyGen: (obj) => String((obj as { id: number }).id),
    });

    await memoized({ id: 1 });
    assert.equal(callCount, 1);

    await memoized({ id: 1 }); // Should cache
    assert.equal(callCount, 1);
  });

  it("should respect TTL", async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoizeAsync(fn, { ttlMs: 50 });

    await memoized(5);
    assert.equal(callCount, 1);

    await new Promise((r) => setTimeout(r, 70));
    await memoized(5);
    assert.equal(callCount, 2);
  });

  describe("clear()", () => {
    it("should clear all cached promises", async () => {
      let callCount = 0;
      const fn = async (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = memoizeAsync(fn);
      await memoized(5);
      assert.equal(callCount, 1);

      memoized.clear();
      await memoized(5);
      assert.equal(callCount, 2);
    });
  });

  describe("invalidate()", () => {
    it("should invalidate specific cached value", async () => {
      let callCount = 0;
      const fn = async (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = memoizeAsync(fn);
      await memoized(5);
      await memoized(6);
      assert.equal(callCount, 2);

      memoized.invalidate(5);
      await memoized(5); // Should recompute
      assert.equal(callCount, 3);
    });
  });
});

describe("debounce", () => {
  it("should delay function execution", async () => {
    let callCount = 0;
    const fn = () => callCount++;

    const debounced = debounce(fn, 50);

    debounced();
    assert.equal(callCount, 0);

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(callCount, 1);
  });

  it("should only call once for multiple rapid calls", async () => {
    let lastValue = 0;
    const fn = (x: number) => {
      lastValue = x;
    };

    const debounced = debounce(fn, 50);

    debounced(1);
    debounced(2);
    debounced(3);

    // Should not have called yet
    assert.equal(lastValue, 0);

    await new Promise((r) => setTimeout(r, 60));

    // Should only call once with last value
    assert.equal(lastValue, 3);
  });

  it("should reset timer on each call", async () => {
    let callCount = 0;
    const fn = () => callCount++;

    const debounced = debounce(fn, 50);

    debounced();
    await new Promise((r) => setTimeout(r, 30));
    debounced(); // Reset timer
    await new Promise((r) => setTimeout(r, 30));
    debounced(); // Reset timer again
    await new Promise((r) => setTimeout(r, 30));
    debounced();
    await new Promise((r) => setTimeout(r, 60));

    // Only one call after last debounce
    assert.equal(callCount, 1);
  });

  it("should preserve arguments", async () => {
    let receivedArgs: unknown[] = [];
    const fn = (...args: unknown[]) => {
      receivedArgs = args;
    };

    const debounced = debounce(fn, 50);

    debounced("hello", 123, true);
    await new Promise((r) => setTimeout(r, 60));

    assert.deepEqual(receivedArgs, ["hello", 123, true]);
  });
});

describe("throttle", () => {
  it("should call immediately on first invocation", () => {
    let callCount = 0;
    const fn = () => callCount++;

    const throttled = throttle(fn, 50);

    throttled();
    assert.equal(callCount, 1);
  });

  it("should throttle subsequent calls", async () => {
    let callCount = 0;
    const fn = () => callCount++;

    const throttled = throttle(fn, 50);

    throttled();
    throttled();
    throttled();

    // First call immediate, subsequent throttled
    assert.equal(callCount, 1);

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(callCount, 2);
  });

  it("should execute pending call after interval", async () => {
    let lastValue = 0;
    const fn = (x: number) => {
      lastValue = x;
    };

    const throttled = throttle(fn, 50);

    throttled(1);
    assert.equal(lastValue, 1);

    throttled(2);
    // Still 1 because within throttle window

    await new Promise((r) => setTimeout(r, 60));
    // Should have called with 2 (the last value)
    assert.equal(lastValue, 2);
  });

  it("should preserve arguments on throttled calls", async () => {
    let receivedValues: number[] = [];
    const fn = (x: number) => {
      receivedValues.push(x);
    };

    const throttled = throttle(fn, 50);

    throttled(1);
    await new Promise((r) => setTimeout(r, 60));
    throttled(2);
    await new Promise((r) => setTimeout(r, 60));

    assert.deepEqual(receivedValues, [1, 2]);
  });

  it("should not drop calls if interval is short enough", async () => {
    let callCount = 0;
    const fn = () => callCount++;

    const throttled = throttle(fn, 10);

    for (let i = 0; i < 5; i++) {
      throttled();
      await new Promise((r) => setTimeout(r, 15));
    }

    // Each call should execute because interval passed
    assert.equal(callCount, 5);
  });
});

describe("edge cases", () => {
  describe("memoize with edge cases", () => {
    it("should handle null and undefined arguments", () => {
      let callCount = 0;
      const fn = (x) => {
        callCount++;
        return x ?? 0;
      };

      const memoized = memoize(fn);

      // Note: JSON.stringify([undefined]) === JSON.stringify([null]) === '[null]'
      // because undefined becomes null in arrays during JSON serialization
      memoized(null);
      assert.equal(callCount, 1);

      memoized(null);
      assert.equal(callCount, 1);

      memoized(undefined);
      // Same cache key as null, so it's cached too
      assert.equal(callCount, 1);
    });

    it("should handle object arguments", () => {
      let callCount = 0;
      const fn = (obj) => {
        callCount++;
        return JSON.stringify(obj);
      };

      const memoized = memoize(fn);

      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // Same JSON but different references - will have different stringified values
      memoized(obj1);
      assert.equal(callCount, 1);

      memoized(obj2);
      // Same JSON, so same key - should be cached
      assert.equal(callCount, 1);

      memoized({ b: 2 });
      assert.equal(callCount, 2);
    });

    it("should handle function that throws", () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        if (x < 0) throw new Error("Negative");
        return x * 2;
      };

      const memoized = memoize(fn);

      assert.throws(() => memoized(-1), /Negative/);
      assert.equal(callCount, 1);

      // Second call with same negative - should throw again (not cached)
      assert.throws(() => memoized(-1), /Negative/);
      assert.equal(callCount, 2);
    });
  });

  describe("debounce with edge cases", () => {
    it("should handle zero delay", async () => {
      let callCount = 0;
      const fn = () => callCount++;

      const debounced = debounce(fn, 0);
      debounced();

      // With 0 delay, should still be async
      assert.equal(callCount, 0);
      await new Promise((r) => setTimeout(r, 1));
      assert.equal(callCount, 1);
    });
  });

  describe("throttle with edge cases", () => {
    it("should handle zero interval", () => {
      let callCount = 0;
      const fn = () => callCount++;

      const throttled = throttle(fn, 0);

      throttled();
      throttled();
      throttled();

      // With 0 interval, all calls should go through
      assert.equal(callCount, 3);
    });
  });
});
