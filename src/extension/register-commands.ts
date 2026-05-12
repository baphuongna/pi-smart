import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { Intensity } from "../config.ts";
import type { SessionCost } from "../cost/tracker.ts";
import { formatDetailedCost, formatWidgetString, formatWidgetData } from "../cost/widget.ts";

interface SessionState {
	intensity: Intensity;
	budgetState: string;
	config: { enabled: boolean; filters: { enabled: boolean; profiles: Record<string, string[]>; defaultProfile: string[] } };
	totalBytesIn: number;
	totalBytesOut: number;
	costTracker: {
		getSessionCost: (fn: (model: string, usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number }) => number) => SessionCost;
	};
	pricing: { calculateCost: (model: string, usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number }) => number };
}

export interface SmartCommandDeps {
	getState: () => SessionState;
	getCostSummary: () => SessionCost;
	setIntensity: (intensity: Intensity) => void;
}

export function registerSmartCommands(pi: ExtensionAPI, deps: SmartCommandDeps): void {
	const { getState, getCostSummary, setIntensity } = deps;

	pi.registerCommand("smart", {
		description: "pi-smart status and configuration",
			handler: async (args: string, _ctx: ExtensionCommandContext): Promise<void> => {
			const state = getState();
			const cost = getCostSummary();
			const arg = args?.trim().split(/\s+/)[0];

			if (arg === "cost") {
				console.log(formatDetailedCost(cost));
				return;
			}

			if (arg === "filters") {
				const profiles = Object.entries(state.config.filters.profiles)
					.map(([key, filters]) => `  ${key}: [${filters.join(", ")}]`)
					.join("\n");
				console.log([
					"pi-smart Filter Profiles:",
					profiles,
					`  default: [${state.config.filters.defaultProfile.join(", ")}]`,
				].join("\n"));
				return;
			}

			if (arg === "terse" || arg === "normal" || arg === "verbose") {
				setIntensity(arg);
				console.log(`pi-smart intensity set to ${arg}`);
				return;
			}

			// Default: show status dashboard
			const data = formatWidgetData(cost, state.intensity, state.totalBytesIn - state.totalBytesOut, state.totalBytesIn);
			console.log([
				"pi-smart Status:",
				`  Output filtering: ${state.config.filters.enabled ? "ON" : "OFF"} (saved ${state.totalBytesIn > 0 ? Math.round((state.totalBytesIn - state.totalBytesOut) / 1024) : 0}KB this session)`,
				`  Response compression: ${state.intensity}`,
				`  Context budget: ${state.budgetState}`,
				`  Session cost: ${data.totalCost} (${data.totalTokens} tokens)`,
				"",
				formatWidgetString(data),
				"",
				"Usage: /smart terse|normal|verbose | /smart cost | /smart filters",
			].join("\n"));
		},
	});
}
