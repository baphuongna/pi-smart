export interface ContextUsage {
	usedTokens: number;
	totalTokens: number;
	percentage: number;
}

export function getContextUsage(raw: { tokens: number | null } | null | undefined): ContextUsage | null {
	if (!raw || raw.tokens === null || raw.tokens === undefined) return null;
	// tokens from Pi may be the used count; total comes from model context window
	// The caller must provide contextWindow separately
	return {
		usedTokens: raw.tokens,
		totalTokens: 0, // Will be filled by caller with ctx.model?.contextWindow
		percentage: 0,
	};
}

export function calculatePercentage(used: number, total: number): number {
	if (total <= 0) return 0;
	return used / total;
}
