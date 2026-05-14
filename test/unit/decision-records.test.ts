import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
	createDecision,
	formatDecisionSummary,
	toMarkdown,
	toInlineComment,
	decisionStore,
	createRecollectAdapter,
	reviewDecision,
	supersedeDecision,
	generateAdrIndex,
	exampleCreateDecision,
	type DecisionRecord,
	type CreateDecisionInput,
} from "../../src/governance/decision-records.ts";

// Helper for checking substring inclusion (since Node test assert lacks .include)
function strContains(actual: string, expected: string): void {
	if (!actual.includes(expected)) {
		throw new Error(`Expected string to contain "${expected}"`);
	}
}

describe("decision-records", () => {
	const testDecision: CreateDecisionInput = {
		title: "Use SQLite for memory storage",
		context:
			"We need persistent storage for agent memory. Options include file-based JSON, SQLite, and PostgreSQL. " +
			"File-based JSON is simple but doesn't scale. PostgreSQL requires a running server.",
		decision:
			"Use SQLite via better-sqlite3. It provides ACID guarantees, full-text search via FTS5, " +
			"and requires no external server.",
		alternatives: [
			{
				title: "File-based JSON",
				reason: "Simple but no concurrent access, no query capability.",
			},
			{
				title: "PostgreSQL",
				reason: "Too heavy for single-agent use case; requires separate server.",
			},
		],
		consequences: {
			positive: [
				"Fast local queries with FTS5",
				"ACID transactions for memory writes",
				"No external dependencies",
			],
			negative: [
				"Single file may grow large",
				"Not designed for multi-process access",
			],
		},
		followUp: [
			"Set up database schema and migrations",
			"Implement FTS5 index for content search",
			"Add backup/restore functionality",
		],
		tags: ["storage", "sqlite", "performance"],
		appliesTo: ["pi-recollect", "pi-memory"],
	};

	describe("createDecision", () => {
		it("creates a decision with a generated ID", () => {
			const decision = createDecision(testDecision);
			assert.match(decision.id, /^adr-\d+-[a-f0-9]{8}$/);
		});

		it("sets createdAt to current ISO timestamp", () => {
			const decision = createDecision(testDecision);
			assert.match(decision.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it("defaults status to pending", () => {
			const decision = createDecision(testDecision);
			assert.equal(decision.status, "pending");
		});

		it("defaults empty arrays for optional fields", () => {
			const simple = createDecision({ title: "Test", context: "Context", decision: "Decision" });
			assert.deepEqual(simple.alternatives, []);
			assert.deepEqual(simple.consequences, { positive: [], negative: [] });
			assert.deepEqual(simple.followUp, []);
			assert.deepEqual(simple.tags, []);
			assert.deepEqual(simple.appliesTo, []);
		});

		it("preserves all provided fields", () => {
			const decision = createDecision(testDecision);
			assert.equal(decision.title, testDecision.title);
			assert.equal(decision.context, testDecision.context);
			assert.equal(decision.decision, testDecision.decision);
			assert.equal(decision.alternatives.length, 2);
			assert.equal(decision.consequences.positive.length, 3);
			assert.equal(decision.consequences.negative.length, 2);
			assert.equal(decision.followUp.length, 3);
			assert.deepEqual(decision.tags, testDecision.tags);
			assert.deepEqual(decision.appliesTo, testDecision.appliesTo);
		});
	});

	describe("formatDecisionSummary", () => {
		it("includes title and ID", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, `# Decision Record: ${decision.title}`);
			strContains(summary, `**ID**: ${decision.id}`);
		});

		it("includes context and decision sections", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, "## Context");
			strContains(summary, decision.context);
			strContains(summary, "## Decision");
			strContains(summary, decision.decision);
		});

		it("lists alternatives when present", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, "## Alternatives Considered");
			strContains(summary, "File-based JSON");
			strContains(summary, "PostgreSQL");
		});

		it("lists consequences in separate sections", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, "## Consequences");
			strContains(summary, "### Positive");
			strContains(summary, "### Negative");
			strContains(summary, "Fast local queries");
			strContains(summary, "Single file may grow");
		});

		it("lists follow-up actions as unchecked items", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, "## Follow-Up Actions");
			strContains(summary, "- [ ] Set up database schema");
		});

		it("includes appliesTo and tags", () => {
			const decision = createDecision(testDecision);
			const summary = formatDecisionSummary(decision);
			strContains(summary, "## Applies To");
			strContains(summary, "pi-recollect");
			strContains(summary, "**Tags**: storage, sqlite, performance");
		});

		it("shows reviewed date when present", () => {
			const decision = createDecision(testDecision);
			decision.reviewedAt = "2026-01-15T10:00:00.000Z";
			const summary = formatDecisionSummary(decision);
			strContains(summary, "**Reviewed**: 2026-01-15T10:00:00.000Z");
		});

		it("shows superseded info when present", () => {
			const decision = createDecision(testDecision);
			decision.supersededBy = "adr-123456-abc12345";
			const summary = formatDecisionSummary(decision);
			strContains(summary, "**Superseded By**: adr-123456-abc12345");
		});
	});

	describe("toMarkdown", () => {
		it("generates markdown with header by default", () => {
			const decision = createDecision(testDecision);
			const md = toMarkdown(decision);
			assert.ok(md.startsWith("# Decision Record:"));
		});

		it("generates compact format without header", () => {
			const decision = createDecision(testDecision);
			const md = toMarkdown(decision, false);
			assert.ok(md.startsWith("## "));
			strContains(md, "**Decision**");
		});
	});

	describe("toInlineComment", () => {
		it("creates a compact comment with ADR prefix", () => {
			const decision = createDecision(testDecision);
			const comment = toInlineComment(decision);
			assert.ok(comment.startsWith("// ADR"));
			strContains(comment, decision.id);
			strContains(comment, decision.title);
		});
	});

	describe("decisionStore", () => {
		beforeEach(() => {
			// Clear store before each test
			for (const id of decisionStore.listIds()) {
				decisionStore.remove(id);
			}
		});

		it("stores and retrieves a decision", () => {
			const decision = createDecision(testDecision);
			decisionStore.store(decision);

			const retrieved = decisionStore.get(decision.id);
			assert.ok(retrieved);
			assert.equal(retrieved.id, decision.id);
			assert.equal(retrieved.title, decision.title);
		});

		it("returns null for non-existent ID", () => {
			const result = decisionStore.get("non-existent-id");
			assert.equal(result, null);
		});

		it("finds decisions by query text", () => {
			decisionStore.store(createDecision(testDecision));
			decisionStore.store(createDecision({ title: "Fast builds", context: "Build time is slow", decision: "Use incremental builds" }));

			const results = decisionStore.find({ query: "SQLite" });
			assert.equal(results.length, 1);
			strContains(results[0].title, "SQLite");
		});

		it("finds decisions by tag", () => {
			decisionStore.store(createDecision(testDecision));
			decisionStore.store(createDecision({ title: "Fast builds", context: "Build", decision: "Use caches", tags: ["performance"] }));

			const results = decisionStore.find({ tags: ["storage"] });
			assert.equal(results.length, 1);
			assert.ok(results[0].tags.includes("storage"));
		});

		it("finds decisions by appliesTo", () => {
			decisionStore.store(createDecision(testDecision));
			decisionStore.store(createDecision({ title: "CI", context: "CI", decision: "Use GitHub Actions", appliesTo: ["pi-ci"] }));

			const results = decisionStore.find({ appliesTo: "pi-recollect" });
			assert.equal(results.length, 1);
			assert.ok(results[0].appliesTo.includes("pi-recollect"));
		});

		it("finds decisions by status", () => {
			const d1 = createDecision(testDecision);
			decisionStore.store(d1);

			const d2 = createDecision({ title: "Deprecated", context: "Old", decision: "Old way" });
			d2.status = "deprecated";
			decisionStore.store(d2);

			const results = decisionStore.find({ status: "pending" });
			assert.equal(results.length, 1);
			assert.equal(results[0].status, "pending");
		});

		it("respects limit parameter", () => {
			for (let i = 0; i < 10; i++) {
				decisionStore.store(createDecision({ title: `Decision ${i}`, context: `Context ${i}`, decision: `Decision ${i}` }));
			}
			const results = decisionStore.find({ limit: 3 });
			assert.equal(results.length, 3);
		});

		it("sorts by createdAt descending (most recent first)", () => {
			// Create first decision
			decisionStore.store(createDecision({ title: "First", context: "C", decision: "D" }));
			// Small delay to ensure different timestamps
			const start = Date.now();
			while (Date.now() - start < 2) { /* wait 2ms */ }
			// Create second decision
			decisionStore.store(createDecision({ title: "Second", context: "C", decision: "D" }));

			const results = decisionStore.find({});
			assert.equal(results[0].title, "Second");
		});

		it("updates an existing decision", () => {
			const decision = createDecision(testDecision);
			decisionStore.store(decision);

			decisionStore.update(decision.id, { status: "accepted", reviewedAt: "2026-01-15T00:00:00.000Z" });

			const updated = decisionStore.get(decision.id);
			assert.equal(updated.status, "accepted");
			assert.equal(updated.reviewedAt, "2026-01-15T00:00:00.000Z");
		});

		it("removes a decision", () => {
			const decision = createDecision(testDecision);
			decisionStore.store(decision);

			decisionStore.remove(decision.id);

			const result = decisionStore.get(decision.id);
			assert.equal(result, null);
		});

		it("lists all decision IDs", () => {
			decisionStore.store(createDecision({ title: "One", context: "C", decision: "D" }));
			decisionStore.store(createDecision({ title: "Two", context: "C", decision: "D" }));

			const ids = decisionStore.listIds();
			assert.equal(ids.length, 2);
		});
	});

	describe("reviewDecision", () => {
		beforeEach(() => {
			for (const id of decisionStore.listIds()) {
				decisionStore.remove(id);
			}
		});

		it("updates reviewedAt timestamp", () => {
			const decision = createDecision(testDecision);
			decisionStore.store(decision);

			const result = reviewDecision(decision.id, decisionStore);
			assert.ok(result?.reviewedAt);
		});

		it("updates status when provided", () => {
			const decision = createDecision(testDecision);
			decisionStore.store(decision);

			const result = reviewDecision(decision.id, decisionStore, { status: "accepted" });
			assert.equal(result?.status, "accepted");
		});

		it("returns null for non-existent ID", () => {
			const result = reviewDecision("non-existent", decisionStore);
			assert.equal(result, null);
		});
	});

	describe("supersedeDecision", () => {
		beforeEach(() => {
			for (const id of decisionStore.listIds()) {
				decisionStore.remove(id);
			}
		});

		it("marks old decision as superseded", () => {
			const old = createDecision(testDecision);
			decisionStore.store(old);

			const newDecision = createDecision({ title: "New approach", context: "Better", decision: "New way" });
			supersedeDecision(old.id, newDecision, decisionStore);

			const updated = decisionStore.get(old.id);
			assert.equal(updated?.status, "superseded");
			assert.equal(updated?.supersededBy, newDecision.id);
		});

		it("stores the new decision", () => {
			const old = createDecision(testDecision);
			decisionStore.store(old);

			const newDecision = createDecision({ title: "New approach", context: "Better", decision: "New way" });
			supersedeDecision(old.id, newDecision, decisionStore);

			const stored = decisionStore.get(newDecision.id);
			assert.ok(stored);
			assert.equal(stored?.title, "New approach");
		});
	});

	describe("generateAdrIndex", () => {
		it("generates markdown table of decisions", () => {
			const records: DecisionRecord[] = [
				createDecision({ title: "First", context: "C", decision: "D" }),
				createDecision({ title: "Second", context: "C", decision: "D" }),
			];

			const index = generateAdrIndex(records);
			strContains(index, "# Decision Records Index");
			strContains(index, "Total: 2 decisions");
			assert.ok(index.includes("| ID | Title |") || index.includes("| ID |"));
			strContains(index, "First");
			strContains(index, "Second");
		});
	});

	describe("createRecollectAdapter", () => {
		it("stores decision using provided recollect function", () => {
			const calls: Array<{ category: string; title: string; content: string; metadata?: Record<string, unknown> }> = [];

			const adapter = createRecollectAdapter(
				(category, title, content, metadata) => {
					calls.push({ category, title, content, metadata });
					return "recollect-id-123";
				},
			);

			const decision = createDecision(testDecision);
			const recollectId = adapter.store(decision);

			assert.equal(recollectId, "recollect-id-123");
			assert.equal(calls.length, 1);
			assert.equal(calls[0].category, "decision");
			assert.equal(calls[0].title, decision.title);
			strContains(calls[0].content, decision.context);
			assert.deepEqual(calls[0].metadata, {
				tags: decision.tags,
				appliesTo: decision.appliesTo,
				status: decision.status,
				decisionId: decision.id,
			});
		});
	});

	describe("exampleCreateDecision", () => {
		it("creates a valid decision record", () => {
			const decision = exampleCreateDecision();

			assert.ok(decision.id);
			strContains(decision.title, "TypeScript strict mode");
			assert.equal(decision.status, "pending");
			assert.ok(decision.alternatives.length >= 2);
			assert.ok(decision.consequences.positive.length >= 2);
			assert.ok(decision.followUp.length >= 2);
			assert.ok(decision.tags.includes("typescript"));
			assert.ok(decision.appliesTo.length >= 2);
		});
	});
});