import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cavemanCompress, lightCompress, compressByIntensity } from "../../src/compress/caveman.ts";

describe("cavemanCompress", () => {
	it("removes filler phrases", () => {
		const result = cavemanCompress("I think the issue is here. It seems like a bug.");
		assert.ok(!result.text.includes("I think"));
		assert.ok(!result.text.includes("It seems like"));
	});

	it("removes pleasantries", () => {
		const result = cavemanCompress("Sure! Here's the answer.");
		assert.ok(!result.text.includes("Sure!"));
	});

	it("preserves code blocks", () => {
		const input = "Here's code:\n```\nconst x = 1;\nI think this is great\n```\nDone";
		const result = cavemanCompress(input);
		assert.ok(result.text.includes("const x = 1;"));
	});

	it("preserves file paths and backtick content", () => {
		const result = cavemanCompress("Edit the `config.ts` file");
		assert.ok(result.text.includes("`config.ts`"));
	});

	it("reports reduction metrics", () => {
		const longText = "I think the reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle. When you pass an inline object as a prop, React's shallow comparison sees it as a different object every time.";
		const result = cavemanCompress(longText);
		assert.ok(result.reductionPct > 0);
		assert.ok(result.tokensAfter <= result.tokensBefore);
	});
});

describe("lightCompress", () => {
	it("removes standalone pleasantries", () => {
		const result = lightCompress("Sure!\nHere's the info.");
		assert.ok(!result.text.includes("Sure!"));
		assert.ok(result.text.includes("info"));
	});

	it("preserves filler words in light mode", () => {
		const input = "I think the answer is 42.";
		const result = lightCompress(input);
		assert.ok(result.text.includes("I think"));
	});
});

describe("compressByIntensity", () => {
	it("returns unchanged in verbose mode", () => {
		const input = "Sure! I think this is great!";
		const result = compressByIntensity(input, "verbose");
		assert.equal(result.text, input);
		assert.equal(result.reductionPct, 0);
	});

	it("applies caveman in terse mode", () => {
		const input = "I think this is important";
		const result = compressByIntensity(input, "terse");
		assert.ok(!result.text.includes("I think"));
	});

	it("applies light in normal mode", () => {
		const input = "Sure!\nHere is the answer.";
		const result = compressByIntensity(input, "normal");
		assert.ok(!result.text.includes("Sure!"));
	});
});
