/**
 * Failure Injection - pi-smart
 * 
 * Injects recent failure memories into system context
 * so the AI learns from past mistakes proactively.
 */

import type { MemoryCategory } from '../types.js';

export interface FailureEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  created: number;
  lastReferenced: number;
}

export interface FailureInjectionConfig {
  enabled: boolean;
  maxAgeDays: number;      // Default: 7
  maxEntries: number;      // Default: 5
  includeCategories: MemoryCategory[];
}

const DEFAULT_CONFIG: FailureInjectionConfig = {
  enabled: true,
  maxAgeDays: 7,
  maxEntries: 5,
  includeCategories: ['failure', 'correction', 'insight', 'tool-quirk']
};

/**
 * Creates failure injector for memory context
 */
export function createFailureInjector(
  getMemories: (category?: MemoryCategory) => FailureEntry[],
  config: Partial<FailureInjectionConfig> = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  return {
    /**
     * Get failures to inject into context
     */
    getInjectableFailures(): FailureEntry[] {
      if (!cfg.enabled) return [];
      
      const now = Date.now();
      const maxAge = cfg.maxAgeDays * 24 * 60 * 60 * 1000;
      const failures: FailureEntry[] = [];
      
      for (const category of cfg.includeCategories) {
        const memories = getMemories(category);
        for (const memory of memories) {
          if (now - memory.created > maxAge) continue;
          if (failures.length >= cfg.maxEntries) break;
          failures.push(memory);
        }
      }
      
      failures.sort((a, b) => b.lastReferenced - a.lastReferenced);
      return failures.slice(0, cfg.maxEntries);
    },
    
    /**
     * Generate injection prompt
     */
    generateInjectionPrompt(): string {
      const failures = this.getInjectableFailures();
      if (failures.length === 0) return '';
      
      const lines = ['\n<failure-memory>'];
      lines.push(`Found ${failures.length} relevant failure memories:`);
      
      for (const f of failures) {
        lines.push(`- [${f.category}] ${f.content.slice(0, 200)}`);
      }
      
      lines.push('Consider these when planning your approach.</failure-memory>\n');
      return lines.join('\n');
    },
    
    getConfig(): FailureInjectionConfig {
      return { ...cfg };
    },
    
    updateConfig(updates: Partial<FailureInjectionConfig>): void {
      Object.assign(cfg, updates);
    }
  };
}
