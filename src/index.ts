import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerPiSmart } from "./src/extension/register.ts";

export default function (pi: ExtensionAPI): void {
	registerPiSmart(pi);
}

// Correction detection exports
export { createCorrectionDetector, CORRECTION_STRONG_PATTERNS, CORRECTION_WEAK_PATTERNS, CORRECTION_NEGATIVE_PATTERNS, type CorrectionInfo } from './analyze/correction-detector.js';

// Failure injection exports
export { createFailureInjector, type FailureEntry, type FailureInjectionConfig } from './memory/failure-injector.js';

// Caveman compression exports
export { compressCaveman, getCompressionStats, SHORTEN_MAP, PRESERVE_PATTERNS } from './compress/caveman-rules.js';
