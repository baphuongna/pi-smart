import assert from "node:assert/strict";
import test from "node:test";
import { registerHook, registerHooks, clearHooks, executeHook, getHooks } from "../../src/hooks/hook-system.ts";

test("Hook System - register and get hooks", () => {
  clearHooks();
  registerHook({
    name: "context.filter",
    mode: "non-blocking",
    handler: async () => ({ outcome: "allow" })
  });
  const hooks = getHooks("context.filter");
  assert.strictEqual(hooks.length, 1);
});

test("Hook System - priority ordering", () => {
  clearHooks();
  registerHook({
    name: "context.filter",
    mode: "non-blocking",
    priority: 50,
    handler: async () => ({ outcome: "allow" })
  });
  registerHook({
    name: "context.filter",
    mode: "non-blocking",
    priority: 10,
    handler: async () => ({ outcome: "allow" })
  });
  
  const hooks = getHooks("context.filter");
  assert.strictEqual(hooks[0].priority, 10);
  assert.strictEqual(hooks[1].priority, 50);
});

test("Hook System - execute hook returns allow", async () => {
  clearHooks();
  registerHook({
    name: "context.filter",
    mode: "non-blocking",
    handler: async () => ({ outcome: "allow" })
  });
  
  const report = await executeHook("context.filter", {
    name: "context.filter",
    data: { text: "test" }
  });
  assert.strictEqual(report.outcome, "allow");
  assert.ok(report.durationMs >= 0);
});

test("Hook System - blocking hook returns block", async () => {
  clearHooks();
  registerHook({
    name: "context.filter",
    mode: "blocking",
    handler: async () => ({ outcome: "block", reason: "Not allowed" })
  });
  
  const report = await executeHook("context.filter", {
    name: "context.filter",
    data: {}
  });
  assert.strictEqual(report.outcome, "block");
  assert.strictEqual(report.reason, "Not allowed");
});

test("Hook System - modify hook modifies data and returns modifiedData", async () => {
  clearHooks();
  registerHook({
    name: "context.filter",
    mode: "non-blocking",
    handler: async () => ({
      outcome: "modify",
      data: { filtered: true, text: "modified" }
    })
  });
  
  const ctx = { name: "context.filter" as const, data: { text: "original" } };
  const report = await executeHook("context.filter", ctx);
  
  // The outcome is 'allow' (allow by default after processing), but modifiedData is set
  assert.strictEqual(report.outcome, "allow");
  // The context data is modified
  assert.strictEqual(ctx.data.filtered, true);
  // The report includes the modified data
  assert.ok(report.modifiedData);
  assert.strictEqual(report.modifiedData!.filtered, true);
});

test("Hook System - non-existent hook returns allow", async () => {
  clearHooks();
  const report = await executeHook("context.filter", { name: "context.filter", data: {} });
  assert.strictEqual(report.outcome, "allow");
});
