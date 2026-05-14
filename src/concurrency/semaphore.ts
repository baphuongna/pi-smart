/**
 * Semaphore - Concurrency limiting utility
 * 
 * Simple counting semaphore for limiting concurrent async operations.
 * Ported from pi-pipeline/src/concurrency/semaphore.ts
 */

export class Semaphore {
  #max: number;
  #current = 0;
  #queue: Array<() => void> = [];

  constructor(max: number) {
    this.#max = Math.max(1, max);
  }

  /**
   * Acquire a semaphore slot. Blocks if all slots are taken.
   */
  async acquire(): Promise<void> {
    if (this.#current < this.#max) {
      this.#current++;
      return;
    }

    const { promise, resolve } = (() => {
      let res: () => void;
      const p = new Promise<void>((r) => { res = r; });
      return { promise: p, resolve: res! };
    })();

    this.#queue.push(resolve);
    return promise;
  }

  /**
   * Release a semaphore slot.
   */
  release(): void {
    const next = this.#queue.shift();
    if (next) {
      next();
    } else if (this.#current > 0) {
      this.#current--;
    }
  }

  /**
   * Current number of acquired slots.
   */
  get current(): number {
    return this.#current;
  }

  /**
   * Maximum number of slots.
   */
  get max(): number {
    return this.#max;
  }

  /**
   * Number of waiting acquisitions.
   */
  get waiting(): number {
    return this.#queue.length;
  }

  /**
   * Run a function with semaphore protection.
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Clear all waiting acquisitions.
   */
  clear(): void {
    this.#queue = [];
  }
}