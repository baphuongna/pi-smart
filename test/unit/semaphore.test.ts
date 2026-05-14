/**
 * Semaphore Tests
 */

import assert from "node:assert/strict";
import test from "node:test";
import { Semaphore } from "../../src/concurrency/semaphore.ts";

test("Semaphore - should allow acquiring up to max slots", async () => {
  const sem = new Semaphore(2);
  
  assert.strictEqual(sem.current, 0);
  assert.strictEqual(sem.max, 2);
  
  await sem.acquire();
  assert.strictEqual(sem.current, 1);
  
  await sem.acquire();
  assert.strictEqual(sem.current, 2);
  
  sem.release();
  assert.strictEqual(sem.current, 1);
  
  sem.release();
  assert.strictEqual(sem.current, 0);
});

test("Semaphore - should block when all slots are taken", async () => {
  const sem = new Semaphore(1);
  
  await sem.acquire();
  assert.strictEqual(sem.current, 1);
  
  // This should be waiting
  const acquirePromise = sem.acquire();
  assert.strictEqual(sem.waiting, 1);
  
  // Release should unblock the waiting
  sem.release();
  await acquirePromise;
  
  assert.strictEqual(sem.current, 1);
  assert.strictEqual(sem.waiting, 0);
});

test("Semaphore - should handle withLock correctly", async () => {
  const sem = new Semaphore(2);
  let counter = 0;
  
  await sem.withLock(async () => {
    counter++;
    await new Promise(r => setTimeout(r, 10));
  });
  
  assert.strictEqual(counter, 1);
  assert.strictEqual(sem.current, 0);
});

test("Semaphore - should clear waiting queue", () => {
  const sem = new Semaphore(1);
  
  sem.acquire();
  sem.acquire(); // This will be queued
  sem.acquire(); // This will be queued
  
  assert.strictEqual(sem.waiting, 2);
  
  sem.clear();
  
  assert.strictEqual(sem.waiting, 0);
});

test("Semaphore - should enforce minimum of 1 slot", () => {
  const sem = new Semaphore(0);
  assert.strictEqual(sem.max, 1);
  
  const neg = new Semaphore(-5);
  assert.strictEqual(neg.max, 1);
});

test("Semaphore - should be reentrant for different callers", async () => {
  const sem = new Semaphore(2);
  const results: number[] = [];
  
  const tasks = [
    sem.withLock(async () => {
      results.push(1);
      await new Promise(r => setTimeout(r, 5));
      return 1;
    }),
    sem.withLock(async () => {
      results.push(2);
      return 2;
    }),
  ];
  
  const all = await Promise.all(tasks);
  assert.deepStrictEqual(all, [1, 2]);
});