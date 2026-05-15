/**
 * Hook System - Plugin system with blocking/non-blocking hooks
 * Pattern from: pi-crew/src/hooks/registry.ts
 */

export type HookName = 
  // Lifecycle hooks
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PreCompact'
  | 'Stop'
  | 'Subagent'
  | 'SessionEnd'
  | 'Notification'
  | 'TaskCompleted'
  | 'PostToolUseFailure'
  | 'PreLlmContext'
  // Context hooks
  | 'context.filter'
  | 'context.enrich'
  | 'context.compress'
  | 'context.evaluate'
  // Query hooks
  | 'query.analyze'
  | 'query.search'
  // Search hooks
  | 'search.rank'
  // Sandbox hooks
  | 'sandbox.evaluate'
  // Memory hooks
  | 'memory.store'
  | 'memory.retrieve'
  // Index hooks
  | 'index.update'
  | 'index.query';

export type HookMode = 'blocking' | 'non-blocking';

export type HookOutcome = 'allow' | 'block' | 'modify' | 'diagnostic';

export interface HookResult {
  outcome: HookOutcome;
  reason?: string;
  data?: Record<string, unknown>;
}

export interface HookContext {
  name: HookName;
  data: Record<string, unknown>;
  metadata?: {
    timestamp: number;
    source?: string;
    sessionId?: string;
  };
}

export interface HookDefinition {
  name: HookName;
  mode: HookMode;
  handler: (ctx: HookContext) => HookResult | Promise<HookResult>;
  description?: string;
  priority?: number;
}

export interface HookExecutionReport {
  hookName: HookName;
  outcome: HookOutcome;
  durationMs: number;
  reason?: string;
  modifiedData?: Record<string, unknown>;
}

const registry = new Map<HookName, HookDefinition[]>();

/**
 * Register a hook definition
 */
export function registerHook(definition: HookDefinition): void {
  const hooks = registry.get(definition.name) ?? [];
  hooks.push(definition);
  
  // Sort by priority (lower = higher priority)
  hooks.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  
  registry.set(definition.name, hooks);
}

/**
 * Register multiple hooks at once
 */
export function registerHooks(definitions: HookDefinition[]): void {
  for (const def of definitions) {
    registerHook(def);
  }
}

/**
 * Clear all hooks
 */
export function clearHooks(): void {
  registry.clear();
}

/**
 * Clear hooks for a specific name
 */
export function clearHooksFor(name: HookName): void {
  registry.delete(name);
}

/**
 * Get all hooks for a specific name
 */
export function getHooks(name: HookName): HookDefinition[] {
  return registry.get(name) ?? [];
}

/**
 * Get all registered hook names
 */
export function getRegisteredHookNames(): HookName[] {
  return [...registry.keys()];
}

/**
 * Execute hooks for a specific name
 */
export async function executeHook(name: HookName, ctx: HookContext): Promise<HookExecutionReport> {
  const hooks = getHooks(name);
  if (hooks.length === 0) {
    return { hookName: name, outcome: 'allow', durationMs: 0 };
  }

  const start = Date.now();
  const diagnostics: string[] = [];
  let capturedModifications: Record<string, unknown> | undefined;

  for (const hook of hooks) {
    try {
      const result: HookResult = await Promise.resolve(hook.handler(ctx));
      
      if (hook.mode === 'blocking' && result.outcome === 'block') {
        return {
          hookName: name,
          outcome: 'block',
          durationMs: Date.now() - start,
          reason: result.reason
        };
      }

      if (result.outcome === 'modify' && result.data) {
        Object.assign(ctx.data, result.data);
        capturedModifications = { ...result.data };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (hook.mode === 'blocking') {
        return {
          hookName: name,
          outcome: 'block',
          durationMs: Date.now() - start,
          reason: `Hook error: ${message}`
        };
      }
      
      // Non-blocking hook errors are accumulated as diagnostics
      diagnostics.push(message);
    }
  }

  if (diagnostics.length > 0) {
    return {
      hookName: name,
      outcome: 'diagnostic',
      durationMs: Date.now() - start,
      reason: diagnostics.join('; '),
      modifiedData: capturedModifications
    };
  }

  return {
    hookName: name,
    outcome: 'allow',
    durationMs: Date.now() - start,
    modifiedData: capturedModifications
  };
}

/**
 * Execute multiple hooks in parallel
 */
export async function executeHooksParallel(
  hooks: HookName[],
  ctx: HookContext
): Promise<Map<HookName, HookExecutionReport>> {
  const results = new Map<HookName, HookExecutionReport>();
  
  await Promise.all(
    hooks.map(async (name) => {
      const result = await executeHook(name, ctx);
      results.set(name, result);
    })
  );
  
  return results;
}

/**
 * Execute multiple hooks sequentially
 */
export async function executeHooksSequential(
  hooks: HookName[],
  ctx: HookContext
): Promise<Map<HookName, HookExecutionReport>> {
  const results = new Map<HookName, HookExecutionReport>();
  
  for (const name of hooks) {
    const result = await executeHook(name, ctx);
    results.set(name, result);
    
    // Stop if a blocking hook blocked
    if (result.outcome === 'block') {
      break;
    }
  }
  
  return results;
}

/**
 * Hook event logger interface
 */
export interface HookEventLogger {
  log(report: HookExecutionReport): void;
}

/**
 * Create a simple hook event logger
 */
export function createHookLogger(
  onLog?: (report: HookExecutionReport) => void
): HookEventLogger {
  return {
    log(report: HookExecutionReport) {
      if (onLog) {
        onLog(report);
      } else {
        console.log(`[pi-smart:hook] ${report.hookName}: ${report.outcome} (${report.durationMs}ms)`);
        if (report.reason) {
          console.log(`  Reason: ${report.reason}`);
        }
      }
    }
  };
}

// Predefined hooks for pi-smart

export const CONTEXT_FILTER_HOOK: HookDefinition = {
  name: 'context.filter',
  mode: 'non-blocking',
  description: 'Filter context items before inclusion',
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const CONTEXT_ENRICH_HOOK: HookDefinition = {
  name: 'context.enrich',
  mode: 'non-blocking',
  description: 'Enrich context with additional data',
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const CONTEXT_COMPRESS_HOOK: HookDefinition = {
  name: 'context.compress',
  mode: 'blocking',
  description: 'Compress context before sending to LLM',
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const QUERY_ANALYZE_HOOK: HookDefinition = {
  name: 'query.analyze',
  mode: 'non-blocking',
  description: 'Analyze query before search',
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const SEARCH_RANK_HOOK: HookDefinition = {
  name: 'search.rank',
  mode: 'non-blocking',
  description: 'Rank search results',
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

// --- Lifecycle hooks (predefined) ---

export const SESSION_START_HOOK: HookDefinition = {
  name: 'SessionStart',
  mode: 'non-blocking',
  description: 'Fires when a new session begins',
  priority: 10,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const USER_PROMPT_SUBMIT_HOOK: HookDefinition = {
  name: 'UserPromptSubmit',
  mode: 'non-blocking',
  description: 'Fires after user submits a prompt, before processing',
  priority: 20,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const PRE_TOOL_USE_HOOK: HookDefinition = {
  name: 'PreToolUse',
  mode: 'blocking',
  description: 'Fires before a tool is invoked; can block or modify',
  priority: 30,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const POST_TOOL_USE_HOOK: HookDefinition = {
  name: 'PostToolUse',
  mode: 'non-blocking',
  description: 'Fires after a tool completes successfully',
  priority: 40,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const PRE_COMPACT_HOOK: HookDefinition = {
  name: 'PreCompact',
  mode: 'blocking',
  description: 'Fires before context compaction; can modify compaction behavior',
  priority: 25,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const STOP_HOOK: HookDefinition = {
  name: 'Stop',
  mode: 'blocking',
  description: 'Fires when a stop signal is received; can intercept or allow',
  priority: 5,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const SUBAGENT_HOOK: HookDefinition = {
  name: 'Subagent',
  mode: 'non-blocking',
  description: 'Fires when a subagent is spawned or receives a task',
  priority: 35,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const SESSION_END_HOOK: HookDefinition = {
  name: 'SessionEnd',
  mode: 'non-blocking',
  description: 'Fires when a session terminates',
  priority: 90,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const NOTIFICATION_HOOK: HookDefinition = {
  name: 'Notification',
  mode: 'non-blocking',
  description: 'Fires when an async notification is dispatched',
  priority: 45,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const TASK_COMPLETED_HOOK: HookDefinition = {
  name: 'TaskCompleted',
  mode: 'non-blocking',
  description: 'Fires when a task reaches a terminal state',
  priority: 55,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

export const POST_TOOL_USE_FAILURE_HOOK: HookDefinition = {
  name: 'PostToolUseFailure',
  mode: 'non-blocking',
  description: 'Fires after a tool invocation fails',
  priority: 42,
  handler: async (ctx) => {
    return { outcome: 'diagnostic' };
  }
};

export const PRE_LLM_CONTEXT_HOOK: HookDefinition = {
  name: 'PreLlmContext',
  mode: 'non-blocking',
  description: 'Fires before LLM context is assembled; can inspect or enrich',
  priority: 15,
  handler: async (ctx) => {
    return { outcome: 'allow' };
  }
};

// Predefined hook definitions map for bulk registration
export const LIFECYCLE_HOOKS: HookDefinition[] = [
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
];
