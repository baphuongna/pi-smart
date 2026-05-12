import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveProfile } from "../../src/filter/config.ts";
import type { PiSmartConfig } from "../../src/config.ts";

const TEST_CONFIG: PiSmartConfig = {
	enabled: true,
	filters: {
		enabled: true,
		profiles: {
			"bash: npm test": ["strip-ansi", "collapse-blanks", "head-tail:30"],
			"bash: *": ["strip-ansi", "collapse-blanks", "head-tail:100"],
			"read": ["collapse-blanks", "head-tail:200"],
			"grep": ["collapse-blanks", "head-tail:50"],
		},
		defaultProfile: ["strip-ansi", "collapse-blanks", "head-tail:100"],
	},
	compression: { enabled: true, intensity: "normal", autoIntensify: true },
	budget: { enabled: true, thresholds: { frugal: 0.6, compact: 0.8, emergency: 0.9 }, criticalPins: [] },
	cost: { enabled: true, showWidget: true, pricing: {} },
	analyze: { enabled: true, timeout: 30000, maxOutputBytes: 5120, allowNetwork: false },
};

describe("resolveProfile", () => {
	it("matches specific bash command", () => {
		const filters = resolveProfile("bash", "npm test", TEST_CONFIG);
		assert.equal(filters.length, 3);
		assert.equal(filters[0]!.name, "strip-ansi");
		assert.equal(filters[2]!.name, "head-tail:30");
	});

	it("falls back to bash wildcard", () => {
		const filters = resolveProfile("bash", "ls -la", TEST_CONFIG);
		assert.equal(filters.length, 3);
		assert.equal(filters[0]!.name, "strip-ansi");
		assert.equal(filters[2]!.name, "head-tail:100");
	});

	it("matches tool name directly", () => {
		const filters = resolveProfile("read", undefined, TEST_CONFIG);
		assert.equal(filters.length, 2);
		assert.equal(filters[0]!.name, "collapse-blanks");
	});

	it("uses default profile when no match", () => {
		const filters = resolveProfile("unknown_tool", undefined, TEST_CONFIG);
		assert.equal(filters.length, 3);
		assert.equal(filters[0]!.name, "strip-ansi");
	});

	it("returns empty array when filters disabled", () => {
		const config = { ...TEST_CONFIG, filters: { ...TEST_CONFIG.filters, enabled: false } };
		const filters = resolveProfile("bash", "npm test", config);
		assert.equal(filters.length, 0);
	});
});
