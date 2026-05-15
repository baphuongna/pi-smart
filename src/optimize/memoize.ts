/**
 * Memoize Pattern
 * 
 * Function memoization with TTL and cache management.
 */

export interface MemoizeOptions {
  /** TTL in milliseconds */
  ttlMs?: number;
  /** Maximum cache size */
  maxSize?: number;
  /** Custom key generator */
  keyGen?: (...args: unknown[]) => string;
}

/**
 * Create a memoized version of a function.
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T & { clear: () => void; invalidate: (...args: Parameters<T>) => void } {
  const {
    ttlMs = 60000, // 1 minute default
    maxSize = 100,
    keyGen,
  } = options;

  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();
  const keys: string[] = [];

  const memoized = function (...args: Parameters<T>): ReturnType<T> {
    const key = keyGen ? keyGen(...args) : JSON.stringify(args);

    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.value;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, { value: result, expiry: Date.now() + ttlMs });

    // Evict oldest if over capacity
    if (cache.size > maxSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    if (!keys.includes(key)) {
      keys.push(key);
    }

    return result;
  } as T & { clear: () => void; invalidate: (...args: Parameters<T>) => void };

  memoized.clear = () => {
    cache.clear();
    keys.length = 0;
  };

  memoized.invalidate = (...args: Parameters<T>) => {
    const key = keyGen ? keyGen(...args) : JSON.stringify(args);
    cache.delete(key);
    const index = keys.indexOf(key);
    if (index !== -1) {
      keys.splice(index, 1);
    }
  };

  return memoized;
}

/**
 * Create an async memoized function.
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {}
): T & { clear: () => void; invalidate: (...args: Parameters<T>) => void } {
  const {
    ttlMs = 60000,
    maxSize = 100,
    keyGen,
  } = options;

  const cache = new Map<string, { promise: Promise<ReturnType<T>>; expiry: number }>();
  const keys: string[] = [];

  const memoized = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    const key = keyGen ? keyGen(...args) : JSON.stringify(args);

    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.promise;
    }

    const promise = fn(...args) as Promise<ReturnType<T>>;
    cache.set(key, { promise, expiry: Date.now() + ttlMs });

    // Evict oldest if over capacity
    if (cache.size > maxSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    if (!keys.includes(key)) {
      keys.push(key);
    }

    return promise;
  } as T & { clear: () => void; invalidate: (...args: Parameters<T>) => void };

  memoized.clear = () => {
    cache.clear();
    keys.length = 0;
  };

  memoized.invalidate = (...args: Parameters<T>) => {
    const key = keyGen ? keyGen(...args) : JSON.stringify(args);
    cache.delete(key);
    const index = keys.indexOf(key);
    if (index !== -1) {
      keys.splice(index, 1);
    }
  };

  return memoized;
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delayMs);
  };
}

/**
 * Throttle a function.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = intervalMs - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = undefined;
        fn(...args);
      }, remaining);
    }
  };
}
