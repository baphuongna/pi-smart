import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGoal } from "../../src/intent/goal-analyzer.ts";

test("analyzeGoal - detects atomic strategy", () => {
  const result = analyzeGoal("Fix the login bug");
  
  assert.strictEqual(result.strategy, "atomic");
  assert.strictEqual(result.tasks.length, 1);
});

test("analyzeGoal - detects numbered strategy", () => {
  const result = analyzeGoal("1. First task\n2. Second task\n3. Third task");
  
  assert.strictEqual(result.strategy, "numbered");
  assert.strictEqual(result.tasks.length, 3);
});

test("analyzeGoal - detects bulleted strategy", () => {
  const result = analyzeGoal("- First task\n- Second task");
  
  assert.strictEqual(result.strategy, "bulleted");
  assert.strictEqual(result.tasks.length, 2);
});

test("analyzeGoal - recommends reviewer for code review tasks", () => {
  const result = analyzeGoal("Review the code for style issues");
  
  assert.strictEqual(result.tasks[0].role, "reviewer");
});

test("analyzeGoal - recommends security-reviewer for security tasks", () => {
  const result = analyzeGoal("Check for security vulnerabilities");
  
  assert.strictEqual(result.tasks[0].role, "security-reviewer");
});

test("analyzeGoal - detects verification need", () => {
  const result = analyzeGoal("Refactor the authentication module and verify it works");
  
  assert.strictEqual(result.requiresVerification, true);
});

test("analyzeGoal - detects review need", () => {
  const result = analyzeGoal("Review the code changes");
  
  assert.strictEqual(result.requiresReview, true);
});

test("analyzeGoal - calculates confidence based on task count", () => {
  const simple = analyzeGoal("Fix bug");
  // Use conjunction split for multiple tasks
  const complex = analyzeGoal("First complex task and second complex task and third complex task and fourth complex task and fifth complex task and sixth complex task");
  
  assert.strictEqual(simple.confidence, "high");
  // More than 5 tasks = low confidence
  assert.strictEqual(complex.confidence, "low");
});

test("analyzeGoal - assigns executor role by default", () => {
  const result = analyzeGoal("Add a new feature to the application");
  
  assert.strictEqual(result.tasks[0].role, "executor");
});
