import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStripGitDiffStatsFilter } from "../../src/filter/filters/strip-git-diff-stats.ts";

describe("strip-git-diff-stats filter", () => {
	it("removes individual file stats when >10 files, keeps summary", () => {
		const filter = createStripGitDiffStatsFilter();
		const statLines = Array.from({ length: 15 }, (_, i) => ` src/file${i}.ts |  5 ++---`);
		const input = [...statLines, " 15 files changed, 30 insertions(+), 20 deletions(-)"].join("\n");
		const result = filter.apply(input);
		assert.ok(result.includes("15 files changed"));
		assert.ok(!result.includes("src/file0.ts"));
	});

	it("keeps all stats when <=10 files", () => {
		const filter = createStripGitDiffStatsFilter();
		const statLines = Array.from({ length: 5 }, (_, i) => ` src/file${i}.ts |  5 ++---`);
		const input = [...statLines, " 5 files changed, 10 insertions(+), 5 deletions(-)"].join("\n");
		const result = filter.apply(input);
		assert.ok(result.includes("src/file0.ts"));
		assert.ok(result.includes("5 files changed"));
	});

	it("passes through non-stat text unchanged", () => {
		const filter = createStripGitDiffStatsFilter();
		assert.equal(filter.apply("just some text"), "just some text");
	});
});
