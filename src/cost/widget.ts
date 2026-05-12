import type { SessionCost } from "./tracker.ts";

export interface WidgetData {
	totalCost: string;
	totalTokens: string;
	savingsPct: string;
	intensity: string;
}

export function formatWidgetData(sessionCost: SessionCost, intensity: string, bytesSaved: number, bytesIn: number): WidgetData {
	const totalTokens = sessionCost.totalInputTokens + sessionCost.totalOutputTokens;
	const savingsPct = bytesIn > 0 ? Math.round((bytesSaved / bytesIn) * 100) : 0;

	return {
		totalCost: `$${sessionCost.totalCost.toFixed(2)}`,
		totalTokens: formatTokenCount(totalTokens),
		savingsPct: `${savingsPct}%`,
		intensity,
	};
}

export function formatWidgetString(data: WidgetData): string {
	return `💰 ${data.totalCost} | 📊 ${data.totalTokens} tok | 🗜️ ${data.savingsPct} saved | 📉 ${data.intensity}`;
}

export function formatDetailedCost(sessionCost: SessionCost): string {
	const lines: string[] = [
		"pi-smart Cost Breakdown:",
		`  Total: $${sessionCost.totalCost.toFixed(4)}`,
		`  Turns: ${sessionCost.turns}`,
		`  Input tokens: ${formatTokenCount(sessionCost.totalInputTokens)}`,
		`  Output tokens: ${formatTokenCount(sessionCost.totalOutputTokens)}`,
		`  Estimated savings: $${sessionCost.savingsFromFiltering.toFixed(4)}`,
		"",
		"  By model:",
	];

	for (const [model, data] of sessionCost.byModel) {
		lines.push(`    ${model}: $${data.cost.toFixed(4)} (${data.turns} turns, ${formatTokenCount(data.inputTokens + data.outputTokens)} tokens)`);
	}

	return lines.join("\n");
}

function formatTokenCount(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
	return String(count);
}
