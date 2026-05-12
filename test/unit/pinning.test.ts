import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPinnedContext, serializePinnedContext, createPin } from "../../src/budget/pinning.ts";

describe("pinning", () => {
	it("creates a pin with correct type", () => {
		const pin = createPin("task", "Fix the bug");
		assert.equal(pin.type, "task");
		assert.equal(pin.content, "Fix the bug");
	});

	it("returns pins sorted by priority", () => {
		const pins = new Map([
			["conventions", createPin("conventions", "Use tabs")],
			["task", createPin("task", "Fix bug")],
			["errorState", createPin("errorState", "Error: crash")],
		]);
		const result = getPinnedContext(pins, { criticalPins: ["task", "errorState", "conventions"] });
		assert.equal(result[0]!.type, "task");
		assert.equal(result[1]!.type, "errorState");
		assert.equal(result[2]!.type, "conventions");
	});

	it("serializes pinned context", () => {
		const pins = [
			createPin("task", "Fix the bug"),
			createPin("activeFiles", "src/index.ts"),
		];
		const serialized = serializePinnedContext(pins);
		assert.ok(serialized.includes("[task]"));
		assert.ok(serialized.includes("Fix the bug"));
		assert.ok(serialized.includes("[activeFiles]"));
	});

	it("filters by enabled types", () => {
		const pins = new Map([
			["task", createPin("task", "Fix bug")],
			["conventions", createPin("conventions", "Use tabs")],
		]);
		const result = getPinnedContext(pins, { criticalPins: ["task"] });
		assert.equal(result.length, 1);
		assert.equal(result[0]!.type, "task");
	});
});
