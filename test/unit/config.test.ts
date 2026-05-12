import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadSmartConfig } from "../../src/config.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("config loader", () => {
	it("returns defaults when no config file", () => {
		const config = loadSmartConfig(os.tmpdir());
		assert.equal(config.enabled, true);
		assert.equal(config.compression.intensity, "normal");
		assert.equal(config.budget.thresholds.frugal, 0.6);
		assert.ok(config.filters.profiles["bash: *"]);
	});

	it("merges user config with defaults", () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-smart-test-"));
		const piDir = path.join(tmpDir, ".pi");
		fs.mkdirSync(piDir, { recursive: true });
		fs.writeFileSync(path.join(piDir, "pi-smart.json"), JSON.stringify({
			compression: { intensity: "terse" },
			budget: { thresholds: { frugal: 0.5 } },
		}));

		try {
			const config = loadSmartConfig(tmpDir);
			assert.equal(config.compression.intensity, "terse");
			assert.equal(config.budget.thresholds.frugal, 0.5);
			assert.equal(config.budget.thresholds.compact, 0.8); // Default preserved
			assert.equal(config.enabled, true); // Default preserved
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("handles invalid JSON gracefully", () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-smart-test-"));
		const piDir = path.join(tmpDir, ".pi");
		fs.mkdirSync(piDir, { recursive: true });
		fs.writeFileSync(path.join(piDir, "pi-smart.json"), "not json");

		try {
			const config = loadSmartConfig(tmpDir);
			assert.equal(config.enabled, true);
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});
