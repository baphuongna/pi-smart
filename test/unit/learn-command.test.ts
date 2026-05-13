import assert from "node:assert/strict";
import test from "node:test";
import { LearnCommand } from "../../src/learn/learn-command.ts";

test("LearnCommand - getSections returns all sections", () => {
  const cmd = new LearnCommand();
  const sections = cmd.getSections();
  
  assert.ok(sections.length > 0);
  assert.ok(sections.some(s => s.id === "overview"));
  assert.ok(sections.some(s => s.id === "features"));
});

test("LearnCommand - getContent returns content for valid section", () => {
  const cmd = new LearnCommand();
  const content = cmd.getContent("overview");
  
  assert.ok(content.length > 0);
  assert.ok(content.some(line => line.includes("Overview")));
});

test("LearnCommand - getContent returns error for invalid section", () => {
  const cmd = new LearnCommand();
  const content = cmd.getContent("invalid-section");
  
  assert.ok(content.some(line => line.includes("not found")));
});

test("LearnCommand - addSection adds custom section", () => {
  const cmd = new LearnCommand();
  const initialCount = cmd.getSections().length;
  
  cmd.addSection({
    id: "custom",
    title: "Custom",
    icon: "🎯",
    content: () => ["Custom content"],
  });
  
  const sections = cmd.getSections();
  assert.strictEqual(sections.length, initialCount + 1);
  assert.ok(sections.some(s => s.id === "custom"));
});

test("LearnCommand - registerSection works", () => {
  const cmd = new LearnCommand();
  
  cmd.registerSection(
    "advanced",
    "Advanced Topics",
    "🚀",
    () => ["Advanced content here"]
  );
  
  const content = cmd.getContent("advanced");
  assert.ok(content.some(line => line.includes("Advanced")));
});
