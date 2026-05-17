import type { ExtensionAPI, ExtensionContext, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { visual_update_progress } from "@earendil-works/pi-coding-agent";
import { compressByIntensity } from "../compress/caveman.ts";
import { TokenCompressor } from "../compress/token-compressor.ts";
import type { Intensity, BudgetState } from "../config.ts";
import { loadSmartConfig } from "../config.ts";
import { applyPipeline } from "../filter/pipeline.ts";
import { resolveProfile } from "../filter/config.ts";
import { computeBudgetState, getSteeringMessage, shouldAutoCompact } from "../budget/state-machine.ts";
import { calculatePercentage } from "../budget/tracker.ts";
import { CostTracker } from "../cost/tracker.ts";
import { PricingDatabase } from "../cost/pricing.ts";
import { formatWidgetData } from "../cost/widget.ts";
import { getIntensityForBudgetState, getOutputAllowanceMultiplier, validateIntensity } from "../compress/intensity.ts";

import { executeInSandbox } from "../analyze/sandbox.ts";

// Module-level TokenCompressor for command-specific output compression
// Provides 60-90% savings on git/npm/ls/grep commands (vs 20-40% generic filter)
const tokenCompressor = new TokenCompressor();
import { registerSmartCommands } from "./register-commands.ts";
import {
  registerHook,
  registerHooks,
  LIFECYCLE_HOOKS,
  SESSION_START_HOOK,
  USER_PROMPT_SUBMIT_HOOK,
  PRE_TOOL_USE_HOOK,
  POST_TOOL_USE_HOOK,
  PRE_COMPACT_HOOK,
  STOP_HOOK,
  SUBAGENT_HOOK,
  SESSION_END_HOOK,
  NOTIFICATION_HOOK,
  TASK_COMPLETED_HOOK,
  POST_TOOL_USE_FAILURE_HOOK,
  PRE_LLM_CONTEXT_HOOK,
  type HookName,
  type HookContext,
} from "../hooks/hook-system.ts";
import {
  GovernanceEngine,
  DEFAULT_LIFECYCLE_POLICIES,
  type GovernancePolicy,
  type GovernableHook,
} from "../hooks/governance.ts";

interface SessionState {
	config: ReturnType<typeof loadSmartConfig>;
	intensity: Intensity;
	budgetState: BudgetState;
	costTracker: CostTracker;
	pricing: PricingDatabase;
	pinnedContext: Map<string, { content: string }>;
	totalBytesIn: number;
	totalBytesOut: number;
	initialized: boolean;
}

export function registerPiSmart(pi: ExtensionAPI): void {
	let sessionState: SessionState | undefined;
	let currentCtx: ExtensionContext | undefined;

	const getState = (): SessionState => {
		if (!sessionState) throw new Error("pi-smart: no active session");
		return sessionState;
	};

	// --- Session lifecycle ---
	pi.on("session_start", (_event, ctx) => {
		const config = loadSmartConfig(ctx.cwd);
		sessionState = {
			config,
			intensity: config.compression.intensity,
			budgetState: "NORMAL",
			costTracker: new CostTracker(),
			pricing: new PricingDatabase(config.cost.pricing),
			pinnedContext: new Map(),
			totalBytesIn: 0,
			totalBytesOut: 0,
			initialized: true,
		};
		currentCtx = ctx;

		if (config.cost.showWidget && ctx.hasUI) {
			try {
				ctx.ui.notify?.(`pi-smart active: ${sessionState.intensity} mode`, "info");
			} catch {
				// Widget not available in this Pi version
			}
		}
	});

	pi.on("session_shutdown", () => {
		sessionState = undefined;
		currentCtx = undefined;
	});


	// --- Assistant response compression ---
	pi.on("message_end", (event) => {
		const state = sessionState;
		if (!state || !state.config.enabled || !state.config.compression.enabled) return;
		const msg = event as { message?: { role?: string; content?: unknown[] } };
		if (msg.message?.role !== "assistant") return;
		const content = msg.message.content ?? [];
		const textParts = (content as Array<{ type?: string; text?: string }>)
			.filter((c) => c.type === "text" && typeof c.text === "string")
			.map((c) => c.text!);
		if (textParts.length === 0) return;
		const rawText = textParts.join("");
		// Apply caveman compression based on intensity
		const { text: compressed } = compressByIntensity(rawText, state.intensity);
		if (compressed !== rawText) {
			msg.message.content = [{ type: "text", text: compressed }];
		}
	});

	// --- Tool result filtering ---
	try {
		pi.on("tool_result", (event, ctx) => {
			const state = sessionState;
			if (!state || !state.config.enabled || !state.config.filters.enabled) return;

			const eventRecord = event as unknown as Record<string, unknown>;
			const toolName = typeof eventRecord.toolName === "string" ? eventRecord.toolName : "";
			const content = eventRecord.content as Array<{ type: string; text?: string }> | undefined;
			if (!content) return;

			const textParts = content
				.filter((c) => c.type === "text" && typeof c.text === "string")
				.map((c) => c.text!);
			if (textParts.length === 0) return;

			const rawText = textParts.join("");
			const input = eventRecord.input as Record<string, unknown> | undefined;
			const command = input && typeof input === "object" ? (input.command as string | undefined) : undefined;

			const _multiplier = getOutputAllowanceMultiplier(state.budgetState);
			const filters = resolveProfile(toolName, command, state.config);

			const { result, metrics } = applyPipeline(rawText, filters);
			state.totalBytesIn += metrics.bytesIn;
			state.totalBytesOut += metrics.bytesOut;
			state.costTracker.trackBytesFiltered(metrics.bytesIn - metrics.bytesOut);

			// Wire TokenCompressor for command-specific compression (60-90% savings)
			// Runs after generic pipeline — uses detectType() for auto-detection
			const tcResult = tokenCompressor.compress(result, tokenCompressor.detectType(result, command));
			if (tcResult.savings > 20 && tcResult.compressed.length < result.length) {
				state.totalBytesOut += result.length - tcResult.compressed.length;
				return { content: [{ type: "text", text: tcResult.compressed }] };
			}

			if (result !== rawText) {
				// Return modified content to replace the tool result
				// Pi core will merge/replace based on its hook contract
				return { content: [{ type: "text", text: result }] };
			}
		});
	} catch {
		// tool_result hook not available in this Pi version
	}

	// --- Turn end: budget check ---
	pi.on("turn_end", (_event, ctx) => {
		const state = sessionState;
		if (!state || !state.config.enabled || !state.config.budget.enabled) return;

		const rawUsage = ctx.getContextUsage?.() ?? null;
		if (!rawUsage || rawUsage.tokens === null || rawUsage.tokens === undefined) return;

		const contextWindow = (ctx as unknown as { model?: { contextWindow?: number } }).model?.contextWindow ?? 200000;
		const percentage = calculatePercentage(rawUsage.tokens, contextWindow);
		const newState = computeBudgetState(percentage, state.config.budget.thresholds);

		if (newState !== state.budgetState) {
			state.budgetState = newState;

			if (state.config.compression.autoIntensify) {
				state.intensity = getIntensityForBudgetState(newState);
			}

			if (shouldAutoCompact(newState) && currentCtx) {
				try {
					const steering = getSteeringMessage(newState);
					if (steering) {
						ctx.ui.notify?.(`[pi-smart] Context ${Math.round(percentage * 100)}% — ${newState} mode`, "warning");
					}
					if (newState === "EMERGENCY") {
						ctx.compact?.({
							customInstructions: "Preserve task description and active files. Remove old context.",
						});
					}
				} catch {
					// compact not available
				}
			}
		}
	});

	// --- Before agent start: inject steering ---
	pi.on("before_agent_start", (_event, _ctx) => {
		const state = sessionState;
		if (!state || !state.config.enabled) return;

		const steering = getSteeringMessage(state.budgetState);
		if (steering) {
			return { systemNote: steering } as unknown as undefined;
		}
	});

	// --- Register analyze tool ---
	const analyzeTool: ToolDefinition = {
		name: "analyze",
		label: "Analyze",
		description: `Execute code in a sandboxed environment to analyze, count, filter, compare, or process data. Returns stdout only. Use instead of reading many files into context.

When you need to analyze, count, filter, compare, or process data:
1. Write a script that does the analysis
2. Use the analyze tool to execute it
3. console.log() only the answer

NEVER: Read 50 files into context to count functions
INSTEAD: analyze({ language: "javascript", code: "..." })`,
		parameters: {
			type: "object" as never,
			properties: {
				language: { type: "string" as never, enum: ["javascript", "typescript", "python", "shell"] as never, description: "Programming language for the code" },
				code: { type: "string" as never, description: "Code to execute" },
				intent: { type: "string" as never, description: "What we're looking for (enables output gating)" },
				maxOutputBytes: { type: "number" as never, description: "Max output bytes (default: 5120)" },
				allowNetwork: { type: "boolean" as never, description: "Allow network access (default: false)" },
			},
			required: ["language", "code"] as never,
		} as never,
		async execute(_id: string, params: unknown, _signal: AbortSignal | undefined, _onUpdate: unknown, ctx: ExtensionContext) {
			const state = sessionState;
			const p = params as Record<string, unknown>;
			if (!state || !state.config.enabled || !state.config.analyze.enabled) {
				return { content: [{ type: "text" as const, text: "pi-smart analyze tool is disabled" }], details: {} as never };
			}

			const language = p.language as string;
			const code = p.code as string;
			const maxOutputBytes = (p.maxOutputBytes as number | undefined) ?? state.config.analyze.maxOutputBytes;
			const allowNetwork = (p.allowNetwork as boolean | undefined) ?? state.config.analyze.allowNetwork;

			// Show progress
			await visual_update_progress({
				total: 1,
				completed: 0,
				currentTask: `Running ${language} analysis...`,
				phase: "analyze",
			});

			const result = await executeInSandbox({
				language,
				code,
				cwd: ctx.cwd,
				timeout: state.config.analyze.timeout,
				maxOutputBytes,
				allowNetwork,
			});

			if (result.exitCode !== 0 && result.stderr) {
				return {
					content: [{ type: "text" as const, text: `Error (exit ${result.exitCode}):\n${result.stderr}` }],
					isError: true,
					details: {} as never,
				};
			}

			const summary = result.bytesProcessed > result.bytesReturned
				? `\n[pi-smart: ${result.bytesProcessed} bytes → ${result.bytesReturned} bytes, ${Math.round((1 - result.bytesReturned / (result.bytesProcessed || 1)) * 100)}% reduction]`
				: "";

			// Update progress to complete
			await visual_update_progress({
				total: 1,
				completed: 1,
				currentTask: "Analysis complete",
				phase: "analyze",
			});

			return {
				content: [{ type: "text" as const, text: result.stdout + summary }],
				details: { bytesProcessed: result.bytesProcessed, bytesReturned: result.bytesReturned } as never,
			};
		},
	};

	try {
		pi.registerTool(analyzeTool);
	} catch {
		// Tool registration may not be available
	}

	// --- Register smart_config tool ---
	const smartConfigTool: ToolDefinition = {
		name: "smart_config",
		label: "Smart Config",
		description: "Get or set pi-smart runtime configuration",
		parameters: {
			type: "object" as never,
			properties: {
				action: { type: "string" as never, enum: ["get", "set", "reset"] as never, description: "Action to perform" },
				key: { type: "string" as never, description: "Configuration key" },
				value: { description: "Value to set (for 'set' action)" } as never,
			},
			required: ["action", "key"] as never,
		} as never,
		async execute(_id: string, params: unknown) {
			const state = sessionState;
			if (!state) return { content: [{ type: "text" as const, text: "No active session" }], details: {} as never };

			const p = params as Record<string, unknown>;
			const action = p.action as string;
			const key = p.key as string;
			const d = {} as never;

			if (action === "get") {
				switch (key) {
					case "intensity":
						return { content: [{ type: "text" as const, text: state.intensity }], details: d };
					case "filters.enabled":
						return { content: [{ type: "text" as const, text: String(state.config.filters.enabled) }], details: d };
					case "budget.thresholds":
						return { content: [{ type: "text" as const, text: JSON.stringify(state.config.budget.thresholds) }], details: d };
					default:
						return { content: [{ type: "text" as const, text: `Unknown key: ${key}` }], details: d };
				}
			}

			if (action === "set") {
				const value = p.value;
				switch (key) {
					case "intensity": {
						const validated = validateIntensity(String(value));
						if (validated) {
							state.intensity = validated;
							return { content: [{ type: "text" as const, text: `Intensity set to ${validated}` }], details: d };
						}
						return { content: [{ type: "text" as const, text: `Invalid intensity: ${value}. Use: terse, normal, verbose` }], details: d };
					}
					case "filters.enabled":
						state.config.filters.enabled = Boolean(value);
						return { content: [{ type: "text" as const, text: `Filters ${Boolean(value) ? "enabled" : "disabled"}` }], details: d };
					default:
						return { content: [{ type: "text" as const, text: `Cannot set key: ${key}` }], details: d };
				}
			}

			if (action === "reset") {
				state.config = loadSmartConfig(currentCtx?.cwd ?? process.cwd());
				state.intensity = state.config.compression.intensity;
				return { content: [{ type: "text" as const, text: "Configuration reset to defaults" }], details: d };
			}

			return { content: [{ type: "text" as const, text: `Unknown action: ${action}` }], details: d };
		},
	};

	try {
		pi.registerTool(smartConfigTool);
	} catch {
		// Tool registration may not be available
	}

	// --- Register commands ---
	registerSmartCommands(pi, {
		getState,
		getCostSummary: () => {
			const state = getState();
			return state.costTracker.getSessionCost((model, usage) => state.pricing.calculateCost(model, usage));
		},
		setIntensity: (intensity: Intensity) => {
			getState().intensity = intensity;
		},
	});
}
