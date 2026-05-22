/**
 * Goal Analyzer - Pattern from pi-crew team-recommendation.ts
 * 
 * Intent detection and goal decomposition.
 */

export type DecompositionStrategy = "numbered" | "bulleted" | "conjunction" | "atomic";

export interface AnalyzedTask {
  subject: string;
  description: string;
  role: string;
  priority: "low" | "medium" | "high";
}

export interface GoalAnalysis {
  strategy: DecompositionStrategy;
  tasks: AnalyzedTask[];
  confidence: "low" | "medium" | "high";
  estimatedComplexity: number;
  requiresVerification: boolean;
  requiresReview: boolean;
}

const REVIEW_TERMS = ["review", "audit", "security", "vulnerability", "diff", "pr"];
const RESEARCH_TERMS = ["research", "investigate", "compare", "analyze", "find", "trace"];
const FAST_FIX_TERMS = ["quick fix", "fast-fix", "small bug", "typo", "one-line"];
const COMPLEX_TERMS = ["migration", "refactor", "multiple", "parallel", "concurrent"];
const NUMBERED_LINE_RE = /^\s*\d+[.)]\s+(.+)$/;
const BULLETED_LINE_RE = /^\s*[-*•]\s+(.+)$/;
const CONJUNCTION_RE = /\s+(?:and|,)\s+/i;

export function analyzeGoal(goal: string): GoalAnalysis {
  const lines = goal.split("\n").map(l => l.trim()).filter(Boolean);
  const strategy = detectStrategy(lines, goal);
  const tasks = decomposeIntoTasks(goal, strategy);
  
  return {
    strategy,
    tasks,
    confidence: calculateConfidence(goal, tasks),
    estimatedComplexity: estimateComplexity(goal, tasks),
    requiresVerification: detectVerificationNeed(goal),
    requiresReview: detectReviewNeed(goal),
  };
}

function detectStrategy(lines: string[], goal: string): DecompositionStrategy {
  // Check for numbered list
  const numberedLines = lines.map(l => l.match(NUMBERED_LINE_RE)?.[1]).filter(Boolean);
  if (numberedLines.length >= 2) return "numbered";
  
  // Check for bulleted list
  const bulletedLines = lines.map(l => l.match(BULLETED_LINE_RE)?.[1]).filter(Boolean);
  if (bulletedLines.length >= 2) return "bulleted";
  
  // Check for conjunction split
  if (lines.length === 1) {
    const parts = lines[0].split(CONJUNCTION_RE).filter(Boolean);
    if (parts.length >= 2) return "conjunction";
  }
  
  return "atomic";
}

function decomposeIntoTasks(goal: string, strategy: DecompositionStrategy): AnalyzedTask[] {
  const lines = goal.split("\n").map(l => l.trim()).filter(Boolean);
  
  let taskTexts: string[];
  
  switch (strategy) {
    case "numbered":
      taskTexts = lines.map(l => l.match(NUMBERED_LINE_RE)?.[1] ?? l).filter(Boolean);
      break;
    case "bulleted":
      taskTexts = lines.map(l => l.match(BULLETED_LINE_RE)?.[1] ?? l).filter(Boolean);
      break;
    case "conjunction":
      taskTexts = lines[0].split(CONJUNCTION_RE).filter(Boolean);
      break;
    default:
      taskTexts = [goal];
  }
  
  return taskTexts.map(text => ({
    subject: text.slice(0, 80) || "Task",
    description: text,
    role: recommendRole(text),
    priority: recommendPriority(text),
  }));
}

function recommendRole(text: string): string {
  const lower = text.toLowerCase();
  
  // Check security first (more specific)
  if (lower.includes("security") && (lower.includes("vulnerab") || lower.includes("audit") || lower.includes("scan"))) {
    return "security-reviewer";
  }
  if (lower.includes("security")) return "security-reviewer";
  if (RESEARCH_TERMS.some(t => lower.includes(t))) return "explorer";
  if (REVIEW_TERMS.some(t => lower.includes(t))) return "reviewer";
  if (FAST_FIX_TERMS.some(t => lower.includes(t))) return "executor";
  if (lower.includes("test")) return "test-engineer";
  if (lower.includes("doc") || lower.includes("write")) return "writer";
  
  return "executor";
}

function recommendPriority(text: string): "low" | "medium" | "high" {
  const lower = text.toLowerCase();
  
  if (lower.includes("urgent") || lower.includes("critical")) return "high";
  if (lower.includes("minor") || lower.includes("typo") || lower.includes("quick")) return "low";
  
  return "medium";
}

function calculateConfidence(goal: string, tasks: AnalyzedTask[]): "low" | "medium" | "high" {
  const wordCount = goal.trim().split(/\s+/).length;
  
  if (wordCount < 10 && tasks.length === 1) return "high";
  if (wordCount > 50 || tasks.length > 5) return "low";
  
  return "medium";
}

function estimateComplexity(goal: string, tasks: AnalyzedTask[]): number {
  let complexity = tasks.length;
  
  const lower = goal.toLowerCase();
  if (COMPLEX_TERMS.some(t => lower.includes(t))) complexity += 2;
  if (lower.includes("test")) complexity += 1;
  if (lower.includes("security")) complexity += 2;
  
  return Math.min(10, complexity);
}

function detectVerificationNeed(goal: string): boolean {
  const lower = goal.toLowerCase();
  return COMPLEX_TERMS.some(t => lower.includes(t)) || 
         lower.includes("test") ||
         lower.includes("verify");
}

function detectReviewNeed(goal: string): boolean {
  const lower = goal.toLowerCase();
  return REVIEW_TERMS.some(t => lower.includes(t)) ||
         COMPLEX_TERMS.some(t => lower.includes(t)) ||
         lower.includes("security");
}
