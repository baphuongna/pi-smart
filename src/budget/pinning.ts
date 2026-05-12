export interface PinnedContext {
	type: string; // "task" | "activeFiles" | "errorState" | "conventions"
	content: string;
	priority: number; // Lower = higher priority
}

export interface PinningConfig {
	criticalPins: string[];
}

const DEFAULT_PIN_PRIORITY: Record<string, number> = {
	task: 0,
	errorState: 1,
	activeFiles: 2,
	conventions: 3,
};

export function getPinnedContext(
	pins: Map<string, PinnedContext>,
	config: PinningConfig,
): PinnedContext[] {
	const enabledTypes = config.criticalPins.length > 0
		? config.criticalPins
		: Object.keys(DEFAULT_PIN_PRIORITY);

	const result: PinnedContext[] = [];
	for (const type of enabledTypes) {
		const pinned = pins.get(type);
		if (pinned) {
			result.push({
				...pinned,
				priority: DEFAULT_PIN_PRIORITY[type] ?? 99,
			});
		}
	}
	return result.sort((a, b) => a.priority - b.priority);
}

export function serializePinnedContext(pins: PinnedContext[]): string {
	return pins
		.map((pin) => `[${pin.type}]\n${pin.content}`)
		.join("\n\n");
}

export function createPin(type: string, content: string): PinnedContext {
	return {
		type,
		content,
		priority: DEFAULT_PIN_PRIORITY[type] ?? 99,
	};
}
