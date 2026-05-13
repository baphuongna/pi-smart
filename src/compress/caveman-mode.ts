/**
 * Caveman Mode - Token Compression Pattern
 * 
 * "why use many token when few do trick"
 * ~75% token reduction with full technical accuracy
 */

export type CavemanLevel = "lite" | "full" | "ultra" | "wenyan";

export interface CompressionResult {
  original: string;
  compressed: string;
  ratio: number;
  level: CavemanLevel;
}

interface CompressionRule {
  pattern: RegExp;
  replacement: string;
  level?: CavemanLevel[];
}

const CAVEMAN_RULES: CompressionRule[] = [
  // Lite: Drop filler words
  { pattern: /\bSure!\s*/gi, replacement: "", level: ["lite", "full", "ultra"] },
  { pattern: /\bI('d| would) be happy to\s+/gi, replacement: "", level: ["lite", "full"] },
  { pattern: /\bLet me take a look\s+/gi, replacement: "", level: ["lite", "full"] },
  { pattern: /\bThe issue you('re| are) experiencing\s+/gi, replacement: "Bug: ", level: ["lite", "full", "ultra"] },
  { pattern: /\bMost likely caused by\s+/gi, replacement: "caused by ", level: ["lite", "full"] },
  { pattern: /\bI('d| would) recommend\s+/gi, replacement: "use ", level: ["lite", "full", "ultra"] },
  { pattern: /\bWhen you\b/gi, replacement: "you ", level: ["ultra"] },
  { pattern: /\bthat you\b/gi, replacement: "you ", level: ["ultra"] },
  { pattern: /\bthis is\s+/gi, replacement: "this ", level: ["ultra"] },
  
  // Full: Technical terms only
  { pattern: /\bprobably\b/gi, replacement: "", level: ["full", "ultra"] },
  { pattern: /\blikely\b/gi, replacement: "", level: ["full", "ultra"] },
  { pattern: /\bmight\b/gi, replacement: "", level: ["ultra"] },
  { pattern: /\bcould be\b/gi, replacement: "is", level: ["ultra"] },
  
  // Ultra: Telegraphic
  { pattern: /\b, so\b/gi, replacement: ". ", level: ["ultra"] },
  { pattern: /\b because\b/gi, replacement: " - ", level: ["ultra"] },
  { pattern: /\btherefore\b/gi, replacement: " thus", level: ["ultra"] },
  { pattern: /\bhowever\b/gi, replacement: " but", level: ["ultra"] },
  
  // Wenyan: Classical Chinese style
  { pattern: /use/gi, replacement: "以", level: ["wenyan"] },
  { pattern: /new/gi, replacement: "新", level: ["wenyan"] },
  { pattern: /each/gi, replacement: "各", level: ["wenyan"] },
  { pattern: /render/gi, replacement: "渲染", level: ["wenyan"] },
];

/**
 * Compress text using caveman mode
 */
export function compressText(text: string, level: CavemanLevel = "full"): CompressionResult {
  let compressed = text;
  
  // Apply rules for the current level
  for (const rule of CAVEMAN_RULES) {
    if (!rule.level || rule.level.includes(level)) {
      compressed = compressed.replace(rule.pattern, rule.replacement);
    }
  }
  
  // Collapse whitespace
  compressed = compressed.replace(/\s+/g, " ").trim();
  
  // Calculate ratio
  const ratio = ((text.length - compressed.length) / text.length) * 100;
  
  return {
    original: text,
    compressed,
    ratio: Math.max(0, ratio),
    level,
  };
}

/**
 * Check if compression is worth it
 */
export function shouldCompress(text: string, minLength = 100): boolean {
  return text.length >= minLength;
}

/**
 * Format compression as before/after
 */
export function formatCompression(result: CompressionResult): string {
  return `Original: ${result.original.length} chars → Compressed: ${result.compressed.length} chars (${result.ratio.toFixed(0)}% reduction)`;
}

/**
 * Get recommended level based on context
 */
export function recommendLevel(context: "general" | "review" | "explanation"): CavemanLevel {
  switch (context) {
    case "review": return "lite";
    case "explanation": return "full";
    default: return "full";
  }
}
