/**
 * Hook Concurrency Tests
 */

import assert from "node:assert/strict";
import test from "node:test";
import { 
  withHookConcurrency, 
  runHooksWithConcurrencyLimit,
  configureHookConcurrency,
  resetHookSemaphore,
  getHookConcurrencyConfig 
} from "../../src/hooks/concurrency.ts";

test("Hook Concurrency - should run work without limiting when disabled", async () => {
  resetHookSemaphore();
  configureHookConcurrency({ enabled: false });
  
  let executed = false;
  await withHookConcurrency(async () => {
    executed = true;
  });
  
  assert.strictEqual(executed, true);
  
  // Re-enable for other tests
  configureHookConcurrency({ enabled: true });
});

test("Hook Concurrency - should limit concurrent executions", async () => {
  resetHookSemaphore();
  configureHookConcurrency({ maxConcurrent: 2, enabled: true });
  
  const start = Date.now();
  let running = 0;
  let maxRunning = 0;
  
  const tasks = Array.from({ length: 4 }, async () => {
    await withHookConcurrency(async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise(r => setTimeout(r, 20));
      running--;
    });
  });
  
  await Promise.all(tasks);
  const elapsed = Date.now() - start;
  
  // With maxConcurrent=2 and 4 tasks, should take at least 40ms
  assert.ok(elapsed >= 35, `Expected elapsed >= 35ms, got ${elapsed}ms`);
  assert.ok(maxRunning <= 2, `Expected maxRunning <= 2, got ${maxRunning}`);
});

test("Hook Concurrency - should run hooks in parallel without limit", async () => {
  resetHookSemaphore();
  
  const results = await runHooksWithConcurrencyLimit([
    async () => 1,
    async () => 2,
    async () => 3,
  ]);
  
  assert.deepStrictEqual(results, [1, 2, 3]);
});

test("Hook Concurrency - should respect custom concurrency limit", async () => {
  resetHookSemaphore();
  
  let concurrent = 0;
  let maxConcurrent = 0;
  
  const hooks = Array.from({ length: 6 }, () => async () => {
    concurrent++;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await new Promise(r => setTimeout(r, 10));
    concurrent--;
  });
  
  await runHooksWithConcurrencyLimit(hooks, 2);
  
  assert.ok(maxConcurrent <= 2, `Expected maxConcurrent <= 2, got ${maxConcurrent}`);
});

test("Hook Concurrency - should return current config", () => {
  resetHookSemaphore();
  
  const config = getHookConcurrencyConfig();
  
  assert.ok("maxConcurrent" in config);
  assert.ok("enabled" in config);
});

test("Hook Concurrency - should reflect configured changes", () => {
  resetHookSemaphore();
  configureHookConcurrency({ maxConcurrent: 8 });
  
  const config = getHookConcurrencyConfig();
  assert.strictEqual(config.maxConcurrent, 8);
});