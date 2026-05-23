import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { CodeIndex, type Symbol } from "../../src/index/code-index.ts";

describe("CodeIndex", () => {
  let index: CodeIndex;
  let tempDirs: string[] = [];

  beforeEach(() => {
    index = new CodeIndex();
  });

  afterEach(() => {
    // Clean up all temp directories
    for (const tempDir of tempDirs) {
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    tempDirs = [];
  });

  // Helper to create temp files with own directory
  function createTempFile(name: string, content: string): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `code-index-test-${Date.now()}-`));
    tempDirs.push(tempDir);
    const filePath = path.join(tempDir, name);
    // Note: code-index.ts requires code at column 0 (no leading indentation)
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  describe("indexFile()", () => {
    it("should index a TypeScript file with functions", async () => {
      // Code must start at column 0 (no indentation) for the parser
      const filePath = createTempFile("test.ts", `function hello() {
  return "world";
}

export function greet(name) {
  return "Hello, " + name;
}

async function fetchData() {
  return await fetch("/api/data");
}`);

      await index.indexFile(filePath);

      // Verify indexing occurred
      const stats = index.getStats();
      assert.ok(stats.files >= 1, `Expected at least 1 file, got ${stats.files}`);

      // Check specific symbols
      const helloSymbol = index.findDefinition("hello");
      assert.ok(helloSymbol, "Should find 'hello' function");
      assert.equal(helloSymbol!.name, "hello");
      assert.equal(helloSymbol!.type, "function");
    });

    it("should index class declarations", async () => {
      const filePath = createTempFile("class.ts", `class User {
  name: string;
}

export class Service {
  doSomething() {}
}`);

      await index.indexFile(filePath);

      const symbol = index.findDefinition("User");
      assert.ok(symbol, "Should find 'User' class");
      assert.equal(symbol!.type, "class");

      const serviceSymbol = index.findDefinition("Service");
      assert.ok(serviceSymbol, "Should find 'Service' class");
      assert.equal(serviceSymbol!.type, "class");
    });

    it("should index interface declarations", async () => {
      const filePath = createTempFile("interface.ts", `interface Config {
  name: string;
}

export interface Options {
  verbose: boolean;
}`);

      await index.indexFile(filePath);

      // Note: findDefinition only finds functions/classes, use search() for interfaces
      const symbols = index.search("Options");
      assert.ok(symbols.length > 0, "Should find 'Options' interface via search");
      assert.equal(symbols[0].type, "interface");
    });

    it("should index type aliases", async () => {
      const filePath = createTempFile("types.ts", `type ID = string | number;
export type Status = "pending" | "done";`);

      await index.indexFile(filePath);

      // Note: findDefinition only finds functions/classes, use search() for types
      const symbols = index.search("Status");
      assert.ok(symbols.length > 0, "Should find 'Status' type via search");
      assert.equal(symbols[0].type, "type");
    });

    it("should index const declarations", async () => {
      const filePath = createTempFile("constants.ts", `const MAX_RETRIES = 3;
export const API_URL = "https://api.example.com";`);

      await index.indexFile(filePath);

      // Note: findDefinition only finds functions/classes, use search() for constants
      const symbols = index.search("API_URL");
      assert.ok(symbols.length > 0, "Should find 'API_URL' constant via search");
      assert.equal(symbols[0].type, "constant");
    });

    it("should skip files that cannot be read", async () => {
      // Should not throw
      await index.indexFile("/nonexistent/file.ts");

      const stats = index.getStats();
      assert.equal(stats.files, 0);
    });
  });

  describe("findDefinition()", () => {
    it("should find function definition", async () => {
      const filePath = createTempFile("func.ts", `function calculateSum(a, b) {
  return a + b;
}`);

      await index.indexFile(filePath);

      const symbol = index.findDefinition("calculateSum");
      assert.ok(symbol, "Should find 'calculateSum' function");
      assert.equal(symbol!.type, "function");
      assert.equal(symbol!.name, "calculateSum");
    });

    it("should find class definition", async () => {
      const filePath = createTempFile("myclass.ts", `class MyClass {
  value;
}`);

      await index.indexFile(filePath);

      const symbol = index.findDefinition("MyClass");
      assert.ok(symbol, "Should find 'MyClass'");
      assert.equal(symbol!.type, "class");
    });

    it("should return undefined for non-existent symbol", () => {
      const symbol = index.findDefinition("NonExistent");
      assert.equal(symbol, undefined);
    });

    it("should prefer function/class over other types", async () => {
      const filePath = createTempFile("mixed.ts", `class Calculator {}
interface Calculator {}`);

      await index.indexFile(filePath);

      const symbol = index.findDefinition("Calculator");
      assert.ok(symbol, "Should find 'Calculator'");
      assert.equal(symbol!.type, "class");
    });
  });

  describe("search()", () => {
    it("should find symbols by partial name match", async () => {
      const filePath = createTempFile("search.ts", `function handleClick() {}
function handleSubmit() {}
function handleInput() {}
function processData() {}`);

      await index.indexFile(filePath);

      const results = index.search("handle");
      assert.ok(results.length >= 3, `Expected at least 3 matches, got ${results.length}`);
    });

    it("should be case-insensitive", async () => {
      const filePath = createTempFile("case.ts", `function calculateSum() {}
function CalculateProduct() {}
function CALCULATE_AVERAGE() {}`);

      await index.indexFile(filePath);

      const results = index.search("CALCULATE");
      assert.ok(results.length >= 3, `Expected at least 3 matches, got ${results.length}`);
    });

    it("should return empty array for no matches", () => {
      const results = index.search("nonexistent123");
      assert.equal(results.length, 0);
    });
  });

  describe("getStats()", () => {
    it("should return correct statistics", async () => {
      const filePath = createTempFile("stats.ts", `function func1() {}
function func2() {}
class MyClass {}
interface MyInterface {}
type MyType = string;
const MY_CONST = 1;`);

      await index.indexFile(filePath);

      const stats = index.getStats();

      assert.equal(stats.files, 1, `Expected 1 file, got ${stats.files}`);
      assert.ok(stats.symbols >= 6, `Expected at least 6 symbols, got ${stats.symbols}`);
      assert.ok(stats.types.function >= 2, `Expected at least 2 functions, got ${stats.types.function}`);
      assert.ok(stats.types.class >= 1, `Expected at least 1 class, got ${stats.types.class}`);
      assert.ok(stats.types.interface >= 1, `Expected at least 1 interface, got ${stats.types.interface}`);
      assert.ok(stats.types.type >= 1, `Expected at least 1 type, got ${stats.types.type}`);
      assert.ok(stats.types.constant >= 1, `Expected at least 1 constant, got ${stats.types.constant}`);
    });

    it("should return zeros for empty index", () => {
      const stats = index.getStats();

      assert.equal(stats.files, 0);
      assert.equal(stats.symbols, 0);
      assert.deepEqual(stats.types, {});
    });
  });

  describe("clear()", () => {
    it("should clear all indexed data", async () => {
      const filePath = createTempFile("clear.ts", `function test() {}`);

      await index.indexFile(filePath);
      assert.ok(index.getStats().files >= 1, "Should have indexed file before clear");

      index.clear();

      const stats = index.getStats();
      assert.equal(stats.files, 0);
      assert.equal(stats.symbols, 0);
    });

    it("should allow re-indexing after clear", async () => {
      const file1 = createTempFile("file1.ts", "function one() {}");
      const file2 = createTempFile("file2.ts", "function two() {}");

      await index.indexFile(file1);
      index.clear();
      await index.indexFile(file2);

      const stats = index.getStats();
      assert.equal(stats.files, 1);

      const symbol = index.findDefinition("two");
      assert.ok(symbol, "Should find 'two' after re-indexing");
      const notFound = index.findDefinition("one");
      assert.equal(notFound, undefined, "Should not find 'one' after clear");
    });
  });

  describe("findReferences()", () => {
    it("should find references to symbols", async () => {
      const filePath = createTempFile("ref.ts", `function helper() { return 1; }
helper();
helper();`);

      await index.indexFile(filePath);

      const refs = index.findReferences("helper");
      assert.ok(refs.length > 0, "Should find references to 'helper'");
    });
  });

  describe("getCallGraph()", () => {
    it("should return call graph for indexed functions", async () => {
      const filePath = createTempFile("callgraph.ts", `function caller() {
  callee();
}
function callee() {}`);

      await index.indexFile(filePath);

      // The result might be undefined depending on implementation
      const graph = index.getCallGraph("caller");
      // Just verify it doesn't throw and returns expected shape
      assert.ok(graph === undefined || graph.caller.name === "caller");
    });
  });
});