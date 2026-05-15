/**
 * Smart Context Aggregator
 * Combines recent changes, code index, and decisions into unified context
 */

import { BM25Search, type SearchResult } from '../search/bm25.ts';
import { ContextSandbox } from '../sandbox/sandbox.ts';

export interface ContextEntry {
  type: 'file' | 'change' | 'decision' | 'error' | 'output';
  content: string;
  timestamp: number;
  source?: string;
  [key: string]: unknown;
}

export interface SmartContextQuery {
  query?: string;
  types?: ContextEntry['type'][];
  since?: number;
  limit?: number;
}

export interface SmartContextResult {
  entries: ContextEntry[];
  tokens: number;
  sources: string[];
}

/**
 * Smart Context Aggregator
 * Combines multiple context sources with BM25 ranking
 */
export class SmartContext {
  private entries: ContextEntry[] = [];
  private search: BM25Search;
  private sandbox: ContextSandbox;
  private maxTokens: number;

  constructor(maxTokens = 8000) {
    this.search = new BM25Search();
    this.sandbox = new ContextSandbox();
    this.maxTokens = maxTokens;
  }

  /**
   * Add an entry to context
   */
  add(entry: ContextEntry): void {
    this.entries.push(entry);
    this.search.addDocument({
      id: `${entry.type}-${entry.timestamp}`,
      content: entry.content,
      metadata: entry,
    });
  }

  /**
   * Add a file to context
   */
  addFile(path: string, content: string): void {
    this.add({
      type: 'file',
      content: `File: ${path}\n${content}`,
      timestamp: Date.now(),
      source: path,
    });
  }

  /**
   * Add a decision
   */
  addDecision(decision: string, rationale?: string): void {
    this.add({
      type: 'decision',
      content: rationale ? `${decision}\nRationale: ${rationale}` : decision,
      timestamp: Date.now(),
    });
  }

  /**
   * Add an error
   */
  addError(error: string, context?: string): void {
    this.add({
      type: 'error',
      content: context ? `${error}\nContext: ${context}` : error,
      timestamp: Date.now(),
    });
  }

  /**
   * Query context with natural language
   */
  query(q: SmartContextQuery): SmartContextResult {
    let entries: ContextEntry[];

    if (q.query) {
      const results = this.search.search(q.query, q.limit ?? 20);
      entries = results.map((r) => r.item.metadata as ContextEntry);
    } else {
      entries = [...this.entries].sort((a, b) => b.timestamp - a.timestamp);
    }

    // Filter by types
    if (q.types && q.types.length > 0) {
      entries = entries.filter((e) => q.types!.includes(e.type));
    }

    // Filter by time
    if (q.since) {
      entries = entries.filter((e) => e.timestamp >= q.since!);
    }

    // Limit
    const limited = entries.slice(0, q.limit ?? 50);

    // Estimate tokens
    const content = limited.map((e) => e.content).join('\n');
    const tokens = this.estimateTokens(content);

    // Truncate if needed
    let finalEntries = limited;
    let finalTokens = tokens;

    if (tokens > this.maxTokens) {
      const truncated = this.truncateEntries(limited, this.maxTokens);
      finalEntries = truncated.entries;
      finalTokens = truncated.tokens;
    }

    const sources = [...new Set(finalEntries.map((e) => e.source).filter(Boolean))] as string[];

    return {
      entries: finalEntries,
      tokens: finalTokens,
      sources,
    };
  }

  /**
   * Execute analysis in sandbox
   */
  async execute(code: string): Promise<string> {
    const result = await this.sandbox.execute(code);
    if (result.success && result.output) {
      this.add({
        type: 'output',
        content: result.output,
        timestamp: Date.now(),
      });
    }
    return result.success ? (result.output ?? '') : (result.error ?? 'Unknown error');
  }

  /**
   * Analyze code and return insights
   */
  analyze(code: string): {
    functions: string[];
    classes: string[];
    imports: string[];
    exports: string[];
  } {
    return this.sandbox.analyze(code);
  }

  /**
   * Get recent context
   */
  recent(limit = 10): SmartContextResult {
    return this.query({ limit });
  }

  /**
   * Get decisions
   */
  decisions(limit = 10): SmartContextResult {
    return this.query({ types: ['decision'], limit });
  }

  /**
   * Get errors
   */
  errors(limit = 10): SmartContextResult {
    return this.query({ types: ['error'], limit });
  }

  /**
   * Clear old entries
   */
  clear(olderThan?: number): void {
    if (olderThan) {
      const cutoff = Date.now() - olderThan;
      this.entries = this.entries.filter((e) => e.timestamp >= cutoff);
    } else {
      this.entries = [];
      this.search.clear();
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate entries to fit token limit
   */
  private truncateEntries(entries: ContextEntry[], maxTokens: number): {
    entries: ContextEntry[];
    tokens: number;
  } {
    const result: ContextEntry[] = [];
    let tokens = 0;

    for (const entry of entries) {
      const entryTokens = this.estimateTokens(entry.content);
      if (tokens + entryTokens <= maxTokens) {
        result.push(entry);
        tokens += entryTokens;
      } else {
        break;
      }
    }

    return { entries: result, tokens };
  }

  /**
   * Get context size
   */
  get size(): number {
    return this.entries.length;
  }
}
