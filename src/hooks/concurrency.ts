/**
 * Hook Concurrency Limiter
 * 
 * Prevents hook storms by limiting concurrent hook executions.
 * Pattern applied from pi-pipeline/src/concurrency/semaphore.ts
 */

import { Semaphore } from "../concurrency/semaphore.ts";

/**
 * Concurrency config for hook system
 */
export interface HookConcurrencyConfig {
  /** Max concurrent hook executions (default: 4) */
  maxConcurrent: number;
  /** Enable/disable concurrency limiting (default: true) */
  enabled: boolean;
}

const DEFAULT_CONFIG: HookConcurrencyConfig = {
  maxConcurrent: 4,
  enabled: true,
};

// Singleton semaphore (lazy-initialized)
let semaphore: Semaphore | null = null;
let currentConfig: HookConcurrencyConfig = { ...DEFAULT_CONFIG };

/**
 * Initialize or update the concurrency config
 */
export function configureHookConcurrency(config: Partial<HookConcurrencyConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  
  // Reinitialize semaphore if needed
  if (semaphore && currentConfig.maxConcurrent !== semaphore.max) {
    semaphore = new Semaphore(currentConfig.maxConcurrent);
  }
}

/**
 * Get current concurrency config
 */
export function getHookConcurrencyConfig(): HookConcurrencyConfig {
  return { ...currentConfig };
}

/**
 * Get or create the semaphore singleton
 */
function getSemaphore(): Semaphore {
  if (!semaphore) {
    semaphore = new Semaphore(currentConfig.maxConcurrent);
  }
  return semaphore;
}

/**
 * Reset semaphore (useful for testing)
 */
export function resetHookSemaphore(): void {
  semaphore = null;
  currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Run async work with concurrency limiting
 */
export async function withHookConcurrency<T>(
  work: () => Promise<T>
): Promise<T> {
  if (!currentConfig.enabled) {
    return work();
  }
  
  const sem = getSemaphore();
  return sem.withLock(work);
}

/**
 * Run multiple hooks with concurrency limit
 */
export async function runHooksWithConcurrencyLimit<T>(
  hooks: Array<() => Promise<T>>,
  maxConcurrent?: number
): Promise<T[]> {
  if (!currentConfig.enabled && !maxConcurrent) {
    return Promise.all(hooks.map(h => h()));
  }
  
  const sem = maxConcurrent 
    ? new Semaphore(maxConcurrent)
    : getSemaphore();
  
  return Promise.all(
    hooks.map(async (hook) => {
      await sem.acquire();
      try {
        return await hook();
      } finally {
        sem.release();
      }
    })
  );
}