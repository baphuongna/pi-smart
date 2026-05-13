/**
 * Token Usage Tracking
 * 
 * Pattern for tracking token usage across agent sessions.
 * Adopted from pi-subagents3's usage.ts.
 * 
 * Key insight: Usage must be accumulated via `message_end` events
 * to survive context compaction (which replaces session.messages).
 */

/**
 * Lifetime usage components.
 */
export interface LifetimeUsage {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead?: number;
}

/**
 * Delta usage from a single message.
 */
export interface UsageDelta {
  input: number;
  output: number;
  cacheWrite: number;
}

/**
 * Usage tracker that accumulates token usage across sessions.
 * Survives context compaction by accumulating from events.
 */
export class UsageTracker {
  #usage: LifetimeUsage = { input: 0, output: 0, cacheWrite: 0 };
  #messages: UsageDelta[] = [];

  /**
   * Add usage from a message delta.
   * Call this on each `message_end` event.
   */
  add(delta: UsageDelta): void {
    this.#usage.input += delta.input;
    this.#usage.output += delta.output;
    this.#usage.cacheWrite += delta.cacheWrite;
    this.#messages.push({ ...delta });
  }

  /**
   * Get total usage across lifetime.
   */
  get total(): LifetimeUsage {
    return { ...this.#usage };
  }

  /**
   * Get sum of input and output tokens (excludes cache).
   */
  get tokens(): number {
    return this.#usage.input + this.#usage.output;
  }

  /**
   * Get message count.
   */
  get messageCount(): number {
    return this.#messages.length;
  }

  /**
   * Get average usage per message.
   */
  get average(): UsageDelta | null {
    if (this.#messages.length === 0) return null;
    return {
      input: Math.round(this.#usage.input / this.#messages.length),
      output: Math.round(this.#usage.output / this.#messages.length),
      cacheWrite: Math.round(this.#usage.cacheWrite / this.#messages.length),
    };
  }

  /**
   * Get all message deltas.
   */
  get messages(): UsageDelta[] {
    return [...this.#messages];
  }

  /**
   * Clear all usage data.
   */
  clear(): void {
    this.#usage = { input: 0, output: 0, cacheWrite: 0 };
    this.#messages = [];
  }

  /**
   * Export as JSON-serializable object.
   */
  toJSON(): object {
    return {
      total: this.total,
      tokens: this.tokens,
      messageCount: this.messageCount,
      average: this.average,
    };
  }
}

/**
 * Sum of lifetime usage components.
 */
export function getLifetimeTotal(u?: LifetimeUsage): number {
  return u ? u.input + u.output + u.cacheWrite : 0;
}

/**
 * Add usage delta into a target accumulator (mutates target).
 */
export function addUsage(into: LifetimeUsage, delta: LifetimeUsage): void {
  into.input += delta.input;
  into.output += delta.output;
  into.cacheWrite += delta.cacheWrite;
}

/**
 * Create a new usage tracker.
 */
export function createUsageTracker(): UsageTracker {
  return new UsageTracker();
}
