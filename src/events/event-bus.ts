/**
 * Event Bus Pattern
 * 
 * Simple pub/sub event bus with typed channels.
 */

export type EventChannel =
  | "state"
  | "context"
  | "memory"
  | "config"
  | "error";

export type SmartEventType =
  | "context.updated"
  | "context.compacted"
  | "memory.stored"
  | "memory.retrieved"
  | "config.changed"
  | "error.occurred"
  | "state.changed";

export interface EventPayload<T = unknown> {
  type: SmartEventType;
  channel: EventChannel;
  data: T;
  timestamp: number;
  source?: string;
}

export type EventHandler<T = unknown> = (payload: EventPayload<T>) => void | Promise<void>;

export interface EventBusOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Max handlers per event */
  maxHandlers?: number;
}

/**
 * Simple event bus with typed channels.
 */
export class EventBus {
  private handlers = new Map<SmartEventType, Set<EventHandler>>();
  private channelHandlers = new Map<EventChannel, Set<EventHandler>>();
  private globalHandlers: Set<EventHandler> = new Set();
  private readonly debug: boolean;

  constructor(options: EventBusOptions = {}) {
    this.debug = options.debug ?? false;
  }

  /**
   * Subscribe to an event type.
   */
  on<T = unknown>(type: SmartEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * Subscribe to a channel.
   */
  onChannel<T = unknown>(channel: EventChannel, handler: EventHandler<T>): () => void {
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler as EventHandler);

    return () => this.offChannel(channel, handler);
  }

  /**
   * Subscribe to all events.
   */
  onAny<T = unknown>(handler: EventHandler<T>): () => void {
    this.globalHandlers.add(handler as EventHandler);
    return () => this.globalHandlers.delete(handler as EventHandler);
  }

  /**
   * Unsubscribe from an event type.
   */
  off<T = unknown>(type: SmartEventType, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  /**
   * Unsubscribe from a channel.
   */
  offChannel<T = unknown>(channel: EventChannel, handler: EventHandler<T>): void {
    const handlers = this.channelHandlers.get(channel);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  /**
   * Emit an event.
   */
  async emit<T = unknown>(type: SmartEventType, data: T, source?: string): Promise<void> {
    const channel = this.getChannel(type);
    const payload: EventPayload<T> = {
      type,
      channel,
      data,
      timestamp: Date.now(),
      source,
    };

    if (this.debug) {
      console.log(`[EventBus] ${type}`, payload);
    }

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      await this.callHandlers(typeHandlers, payload);
    }

    // Call channel handlers
    const channelHandlers = this.channelHandlers.get(channel);
    if (channelHandlers) {
      await this.callHandlers(channelHandlers, payload);
    }

    // Call global handlers
    await this.callHandlers(this.globalHandlers, payload);
  }

  /**
   * Remove all handlers.
   */
  clear(): void {
    this.handlers.clear();
    this.channelHandlers.clear();
    this.globalHandlers.clear();
  }

  /**
   * Get handler count.
   */
  getHandlerCount(type?: SmartEventType): number {
    if (type) {
      return this.handlers.get(type)?.size ?? 0;
    }
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    for (const handlers of this.channelHandlers.values()) {
      total += handlers.size;
    }
    total += this.globalHandlers.size;
    return total;
  }

  private async callHandlers(handlers: Set<EventHandler>, payload: EventPayload): Promise<void> {
    const errors: Error[] = [];

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      console.error(`[EventBus] ${errors.length} handler error(s):`, errors);
    }
  }

  private getChannel(type: SmartEventType): EventChannel {
    if (type.startsWith("context.")) return "context";
    if (type.startsWith("memory.")) return "memory";
    if (type.startsWith("config.")) return "config";
    if (type.startsWith("error.")) return "error";
    return "state";
  }
}

/**
 * Create an event bus.
 */
export function createEventBus(options?: EventBusOptions): EventBus {
  return new EventBus(options);
}

// Global event bus instance
let globalBus: EventBus | undefined;

export function getGlobalEventBus(): EventBus {
  if (!globalBus) {
    globalBus = new EventBus();
  }
  return globalBus;
}
