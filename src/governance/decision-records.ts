/**
 * Decision Records Module
 * 
 * Provides structured decision tracking for all extensions.
 * Format: context, decision, alternatives, consequences, follow-up
 * 
 * Based on the Decision Records pattern from harness-experimental.
 * @see research-findings/34-deep-research-round-2.md
 */

import * as crypto from "node:crypto";

// ── Types ───────────────────────────────────────────────────────────────────────

export interface DecisionRecord {
	id: string;
	title: string;
	/** Background context that led to this decision */
	context: string;
	/** The decision that was made */
	decision: string;
	/** Alternative options that were considered */
	alternatives: Array<{
		title: string;
		reason: string;
	}>;
	/** Expected and observed consequences */
	consequences: {
		positive: string[];
		negative: string[];
	};
	/** Actions to take based on this decision */
	followUp: string[];
	/** When this decision was made */
	createdAt: string;
	/** When this decision was last reviewed */
	reviewedAt?: string;
	/** Decision status */
	status: "pending" | "accepted" | "deprecated" | "superseded";
	/** Tags for categorization */
	tags: string[];
	/** ID of the decision that superseded this one (if any) */
	supersededBy?: string;
	/** Extensions or modules this decision applies to */
	appliesTo: string[];
}

export interface CreateDecisionInput {
	title: string;
	context: string;
	decision: string;
	alternatives?: Array<{ title: string; reason: string }>;
	consequences?: { positive?: string[]; negative?: string[] };
	followUp?: string[];
	tags?: string[];
	appliesTo?: string[];
}

export interface DecisionQuery {
	query?: string;
	tags?: string[];
	appliesTo?: string;
	status?: DecisionRecord["status"];
	limit?: number;
}

export interface DecisionStore {
	// Store a decision record
	store(decision: DecisionRecord): void;
	
	// Retrieve a decision by ID
	get(id: string): DecisionRecord | null;
	
	// Find decisions matching a query
	find(query: DecisionQuery): DecisionRecord[];
	
	// Update an existing decision
	update(id: string, updates: Partial<DecisionRecord>): void;
	
	// List all decision IDs
	listIds(): string[];
	
	// Remove a decision
	remove(id: string): void;
}

// ── In-Memory Store (default) ──────────────────────────────────────────────────

const memoryStore = new Map<string, DecisionRecord>();

function generateId(): string {
	return `adr-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

// ── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Create a new decision record with generated ID and timestamps.
 */
export function createDecision(input: CreateDecisionInput): DecisionRecord {
	const now = new Date().toISOString();
	return {
		id: generateId(),
		title: input.title,
		context: input.context,
		decision: input.decision,
		alternatives: input.alternatives ?? [],
		consequences: {
			positive: input.consequences?.positive ?? [],
			negative: input.consequences?.negative ?? [],
		},
		followUp: input.followUp ?? [],
		createdAt: now,
		status: "pending",
		tags: input.tags ?? [],
		appliesTo: input.appliesTo ?? [],
	};
}

/**
 * Get a human-readable summary of a decision record.
 */
export function formatDecisionSummary(record: DecisionRecord): string {
	const lines: string[] = [
		`# Decision Record: ${record.title}`,
		``,
		`**ID**: ${record.id}`,
		`**Status**: ${record.status}`,
		`**Created**: ${record.createdAt}`,
		record.reviewedAt ? `**Reviewed**: ${record.reviewedAt}` : null,
		record.supersededBy ? `**Superseded By**: ${record.supersededBy}` : null,
		``,
		`## Context`,
		record.context,
		``,
		`## Decision`,
		record.decision,
	];

	if (record.alternatives.length > 0) {
		lines.push(``, `## Alternatives Considered`);
		for (const alt of record.alternatives) {
			lines.push(`- **${alt.title}**: ${alt.reason}`);
		}
	}

	lines.push(``, `## Consequences`);
	if (record.consequences.positive.length > 0) {
		lines.push(`### Positive`);
		for (const c of record.consequences.positive) {
			lines.push(`- ${c}`);
		}
	}
	if (record.consequences.negative.length > 0) {
		lines.push(`### Negative`);
		for (const c of record.consequences.negative) {
			lines.push(`- ${c}`);
		}
	}

	if (record.followUp.length > 0) {
		lines.push(``, `## Follow-Up Actions`);
		for (const action of record.followUp) {
			lines.push(`- [ ] ${action}`);
		}
	}

	if (record.appliesTo.length > 0) {
		lines.push(``, `## Applies To`, record.appliesTo.join(", "));
	}

	if (record.tags.length > 0) {
		lines.push(``, `**Tags**: ${record.tags.join(", ")}`);
	}

	return lines.filter(Boolean).join("\n");
}

/**
 * Render a decision record to Markdown suitable for documentation.
 */
export function toMarkdown(record: DecisionRecord, includeHeader = true): string {
	if (includeHeader) {
		return formatDecisionSummary(record);
	}

	const lines: string[] = [
		`## ${record.title}`,
		``,
		record.context,
		``,
		`**Decision**: ${record.decision}`,
	];

	if (record.alternatives.length > 0) {
		lines.push(``, `Alternatives: ${record.alternatives.map(a => a.title).join(", ")}`);
	}

	return lines.join("\n");
}

/**
 * Create a mini decision record suitable for embedding in code comments.
 */
export function toInlineComment(record: Pick<DecisionRecord, "title" | "decision" | "id">): string {
	return `// ADR ${record.id}: ${record.title} — ${record.decision}`;
}

// ── Memory Store Implementation ──────────────────────────────────────────────────

/**
 * Default in-memory store for decision records.
 * In production, this would integrate with pi-recollect for persistence.
 */
export const decisionStore: DecisionStore = {
	store(decision: DecisionRecord): void {
		memoryStore.set(decision.id, { ...decision });
	},

	get(id: string): DecisionRecord | null {
		return memoryStore.get(id) ?? null;
	},

	find(query: DecisionQuery): DecisionRecord[] {
		const limit = query.limit ?? 50;
		const results: DecisionRecord[] = [];

		for (const record of memoryStore.values()) {
			// Filter by query text
			if (query.query) {
				const q = query.query.toLowerCase();
				const searchable = [
					record.title,
					record.context,
					record.decision,
					...record.alternatives.map(a => a.title + " " + a.reason),
					...record.consequences.positive,
					...record.consequences.negative,
				].join(" ").toLowerCase();
				if (!searchable.includes(q)) continue;
			}

			// Filter by tags
			if (query.tags && query.tags.length > 0) {
				if (!query.tags.some(tag => record.tags.includes(tag))) continue;
			}

			// Filter by appliesTo
			if (query.appliesTo) {
				if (!record.appliesTo.includes(query.appliesTo)) continue;
			}

			// Filter by status
			if (query.status && record.status !== query.status) continue;

			results.push(record);
		}

		// Sort by createdAt descending (most recent first)
		results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return results.slice(0, limit);
	},

	update(id: string, updates: Partial<DecisionRecord>): void {
		const existing = memoryStore.get(id);
		if (!existing) return;
		memoryStore.set(id, { ...existing, ...updates });
	},

	listIds(): string[] {
		return Array.from(memoryStore.keys()).sort();
	},

	remove(id: string): void {
		memoryStore.delete(id);
	},
};

// ── pi-recollect Integration ────────────────────────────────────────────────────

/**
 * Adapter to store decision records using pi-recollect.
 * This enables persistence across sessions.
 */
export function createRecollectAdapter(
	recollectStore: (category: string, title: string, content: string, metadata?: Record<string, unknown>) => string,
) {
	return {
		store(decision: DecisionRecord): string {
			const content = formatDecisionSummary(decision);
			return recollectStore(
				"decision",
				decision.title,
				content,
				{
					tags: decision.tags,
					appliesTo: decision.appliesTo,
					status: decision.status,
					decisionId: decision.id,
				},
			);
		},
	};
}

// ── Utility Functions ───────────────────────────────────────────────────────────

/**
 * Mark a decision as reviewed and optionally update its status.
 */
export function reviewDecision(
	id: string,
	store: DecisionStore,
	updates?: { status?: DecisionRecord["status"]; notes?: string },
): DecisionRecord | null {
	const record = store.get(id);
	if (!record) return null;

	store.update(id, {
		reviewedAt: new Date().toISOString(),
		...(updates?.status ? { status: updates.status } : {}),
		...(updates?.notes ? { 
			consequences: {
				...record.consequences,
				positive: [...record.consequences.positive, updates.notes],
			}
		} : {}),
	});

	return store.get(id);
}

/**
 * Supersede an existing decision with a new one.
 */
export function supersedeDecision(
	oldId: string,
	newDecision: DecisionRecord,
	store: DecisionStore,
): void {
	store.update(oldId, {
		status: "superseded",
		supersededBy: newDecision.id,
		reviewedAt: new Date().toISOString(),
	});
	store.store(newDecision);
}

/**
 * Generate an ADR (Architecture Decision Record) index as Markdown.
 */
export function generateAdrIndex(records: DecisionRecord[]): string {
	const lines: string[] = [
		"# Decision Records Index",
		"",
		`Total: ${records.length} decisions`,
		"",
		"| ID | Title | Status | Created |",
		"|----|-------|--------|---------|",
	];

	for (const r of records) {
		lines.push(`| ${r.id} | ${r.title} | ${r.status} | ${r.createdAt.split("T")[0]} |`);
	}

	return lines.join("\n");
}

// ── Example Usage ──────────────────────────────────────────────────────────────

/**
 * Example: Creating a decision record for adopting TypeScript strict mode.
 */
export function exampleCreateDecision(): DecisionRecord {
	return createDecision({
		title: "Adopt TypeScript strict mode in all extensions",
		context:
			"Multiple extensions have type errors that lead to runtime bugs. " +
			"Adding strict mode would catch these at compile time.",
		decision:
			"Enable TypeScript strict mode (`strict: true`) in tsconfig.json for all extensions. " +
			"Allow a 2-week migration period with incremental fixes.",
		alternatives: [
			{
				title: "Keep current settings",
				reason: "Avoid breaking changes, but type safety issues persist.",
			},
			{
				title: "Enable strict mode immediately",
				reason: "Too disruptive; blocks feature development during migration.",
			},
		],
		consequences: {
			positive: [
				"Catch type errors at compile time",
				"Better IDE support and autocomplete",
				"Self-documenting code via explicit types",
			],
			negative: [
				"Requires fixing existing type errors",
				"May require type annotations for external packages",
			],
		},
		followUp: [
			"Fix all strict mode errors in pi-smart",
			"Fix all strict mode errors in pi-recollect",
			"Update CI to fail on type errors",
		],
		tags: ["typescript", "quality", "migration"],
		appliesTo: ["pi-smart", "pi-recollect", "pi-pipeline"],
	});
}