import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SmartContext, type ContextEntry } from "../../src/aggregate/smart-context.ts";

describe("SmartContext", () => {
  let context: SmartContext;

  beforeEach(() => {
    context = new SmartContext(8000);
  });

  describe("add()", () => {
    it("should add a context entry", () => {
      const entry: ContextEntry = {
        type: "file",
        content: "const x = 1;",
        timestamp: Date.now(),
        source: "test.ts",
      };

      context.add(entry);
      assert.equal(context.size, 1);
    });

    it("should add multiple entries", () => {
      context.add({ type: "file", content: "file1", timestamp: Date.now() });
      context.add({ type: "change", content: "change1", timestamp: Date.now() });
      context.add({ type: "decision", content: "decision1", timestamp: Date.now() });

      assert.equal(context.size, 3);
    });

    it("should be searchable after adding", () => {
      context.add({ type: "file", content: "function test() {}", timestamp: Date.now() });
      context.add({ type: "file", content: "class MyClass {}", timestamp: Date.now() });

      const results = context.query({ query: "function" });
      assert.ok(results.entries.length >= 1);
    });
  });

  describe("query()", () => {
    it("should return recent entries by default", () => {
      context.add({ type: "file", content: "first", timestamp: 1000 });
      context.add({ type: "file", content: "second", timestamp: 2000 });
      context.add({ type: "file", content: "third", timestamp: 3000 });

      const results = context.query({});
      assert.equal(results.entries.length, 3);
      // Most recent first
      assert.equal(results.entries[0].content, "third");
    });

    it("should filter by types", () => {
      context.add({ type: "file", content: "file1", timestamp: Date.now() });
      context.add({ type: "error", content: "error1", timestamp: Date.now() });
      context.add({ type: "decision", content: "decision1", timestamp: Date.now() });

      const results = context.query({ types: ["error"] });
      assert.equal(results.entries.length, 1);
      assert.equal(results.entries[0].type, "error");
    });

    it("should filter by since timestamp", () => {
      const now = Date.now();
      context.add({ type: "file", content: "old", timestamp: now - 10000 });
      context.add({ type: "file", content: "new", timestamp: now });

      const results = context.query({ since: now - 5000 });
      assert.equal(results.entries.length, 1);
      assert.equal(results.entries[0].content, "new");
    });

    it("should limit results", () => {
      for (let i = 0; i < 20; i++) {
        context.add({ type: "file", content: `file${i}`, timestamp: Date.now() + i });
      }

      const results = context.query({ limit: 5 });
      assert.equal(results.entries.length, 5);
    });

    it("should return sources array", () => {
      context.add({ type: "file", content: "content1", timestamp: Date.now(), source: "file1.ts" });
      context.add({ type: "file", content: "content2", timestamp: Date.now(), source: "file2.ts" });

      const results = context.query({});
      assert.ok(results.sources.includes("file1.ts"));
      assert.ok(results.sources.includes("file2.ts"));
    });

    it("should estimate tokens", () => {
      context.add({ type: "file", content: "x".repeat(100), timestamp: Date.now() });

      const results = context.query({});
      // ~4 chars per token
      assert.ok(results.tokens >= 20);
    });
  });

  describe("recent()", () => {
    it("should return recent entries with default limit", () => {
      for (let i = 0; i < 15; i++) {
        context.add({ type: "file", content: `file${i}`, timestamp: Date.now() + i });
      }

      const results = context.recent();
      assert.equal(results.entries.length, 10); // default limit
    });

    it("should return recent entries with custom limit", () => {
      for (let i = 0; i < 10; i++) {
        context.add({ type: "file", content: `file${i}`, timestamp: Date.now() + i });
      }

      const results = context.recent(5);
      assert.equal(results.entries.length, 5);
    });
  });

  describe("decisions()", () => {
    it("should return only decision entries", () => {
      context.add({ type: "file", content: "file", timestamp: Date.now() });
      context.add({ type: "decision", content: "decision1", timestamp: Date.now() });
      context.add({ type: "decision", content: "decision2", timestamp: Date.now() });
      context.add({ type: "error", content: "error", timestamp: Date.now() });

      const results = context.decisions();
      assert.equal(results.entries.length, 2);
      assert.ok(results.entries.every((e) => e.type === "decision"));
    });

    it("should limit decision results", () => {
      for (let i = 0; i < 10; i++) {
        context.add({ type: "decision", content: `decision${i}`, timestamp: Date.now() + i });
      }

      const results = context.decisions(3);
      assert.equal(results.entries.length, 3);
    });
  });

  describe("errors()", () => {
    it("should return only error entries", () => {
      context.add({ type: "file", content: "file", timestamp: Date.now() });
      context.add({ type: "error", content: "error1", timestamp: Date.now() });
      context.add({ type: "error", content: "error2", timestamp: Date.now() });

      const results = context.errors();
      assert.equal(results.entries.length, 2);
      assert.ok(results.entries.every((e) => e.type === "error"));
    });
  });

  describe("clear()", () => {
    it("should clear all entries without olderThan", () => {
      context.add({ type: "file", content: "file1", timestamp: Date.now() });
      context.add({ type: "file", content: "file2", timestamp: Date.now() });

      context.clear();
      assert.equal(context.size, 0);
    });

    it("should clear only entries older than olderThan", () => {
      const now = Date.now();
      context.add({ type: "file", content: "old", timestamp: now - 10000 });
      context.add({ type: "file", content: "recent", timestamp: now });

      context.clear(5000);
      assert.equal(context.size, 1);
      assert.equal(context.recent().entries[0].content, "recent");
    });
  });

  describe("addFile()", () => {
    it("should add a file entry with source", () => {
      context.addFile("src/test.ts", "const x = 1;");

      const results = context.query({ types: ["file"] });
      assert.equal(results.entries.length, 1);
      assert.ok(results.entries[0].content.includes("src/test.ts"));
    });
  });

  describe("addDecision()", () => {
    it("should add a decision entry", () => {
      context.addDecision("Use TypeScript", "Better type safety");

      const results = context.decisions();
      assert.equal(results.entries.length, 1);
      assert.ok(results.entries[0].content.includes("Use TypeScript"));
    });

    it("should include rationale when provided", () => {
      context.addDecision("Use TypeScript", "Better type safety");

      const results = context.decisions();
      assert.ok(results.entries[0].content.includes("Rationale:"));
    });
  });

  describe("addError()", () => {
    it("should add an error entry", () => {
      context.addError("TypeError: Cannot read property");

      const results = context.errors();
      assert.equal(results.entries.length, 1);
      assert.ok(results.entries[0].content.includes("TypeError"));
    });

    it("should include context when provided", () => {
      context.addError("TypeError", "发生在 parseUser 函数中");

      const results = context.errors();
      assert.ok(results.entries[0].content.includes("Context:"));
    });
  });

  describe("size property", () => {
    it("should return correct size", () => {
      assert.equal(context.size, 0);

      context.add({ type: "file", content: "file1", timestamp: Date.now() });
      assert.equal(context.size, 1);

      context.add({ type: "file", content: "file2", timestamp: Date.now() });
      assert.equal(context.size, 2);
    });
  });
});
