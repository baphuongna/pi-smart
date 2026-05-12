import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeInSandbox } from "../../src/analyze/sandbox.ts";

describe("sandbox", () => {
	it("executes JavaScript and returns stdout", async () => {
		const result = await executeInSandbox({
			language: "javascript",
			code: "console.log('hello from sandbox');",
			cwd: process.cwd(),
			timeout: 5000,
		});
		assert.equal(result.exitCode, 0);
		assert.ok(result.stdout.includes("hello from sandbox"));
	});

	it("captures stderr on error", async () => {
		const result = await executeInSandbox({
			language: "javascript",
			code: "throw new Error('test error');",
			cwd: process.cwd(),
			timeout: 5000,
		});
		assert.notEqual(result.exitCode, 0);
		assert.ok(result.stderr.includes("test error"));
	});

	it("returns error for unsupported language", async () => {
		const result = await executeInSandbox({
			language: "rust",
			code: "fn main() {}",
			cwd: process.cwd(),
		});
		assert.ok(result.stderr.includes("Unsupported language"));
	});

	it("times out for long-running code", async () => {
		const result = await executeInSandbox({
			language: "javascript",
			code: "while(true) {}",
			cwd: process.cwd(),
			timeout: 1000,
		});
		assert.ok(result.timedOut || result.exitCode !== 0);
	});

	it("truncates large output", async () => {
		const result = await executeInSandbox({
			language: "javascript",
			code: "console.log('x'.repeat(10000));",
			cwd: process.cwd(),
			timeout: 5000,
			maxOutputBytes: 100,
		});
		assert.ok(result.stdout.includes("truncated"));
		assert.ok(result.bytesProcessed > result.bytesReturned);
	});

	it("tracks bytes processed and returned", async () => {
		const result = await executeInSandbox({
			language: "javascript",
			code: "console.log('hello');",
			cwd: process.cwd(),
			timeout: 5000,
		});
		assert.ok(result.bytesProcessed > 0);
		assert.ok(result.bytesReturned > 0);
	});
});
