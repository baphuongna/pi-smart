import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  EventBus,
  createEventBus,
  getGlobalEventBus,
  type SmartEventType,
  type EventChannel,
  type EventPayload,
} from "../../src/events/event-bus.ts";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("on() and off()", () => {
    it("should subscribe to an event and receive it", async () => {
      let received = false;
      bus.on("context.updated", () => {
        received = true;
      });

      await bus.emit("context.updated", { value: 1 });
      assert.ok(received);
    });

    it("should return unsubscribe function", async () => {
      let callCount = 0;
      const unsubscribe = bus.on("context.updated", () => {
        callCount++;
      });

      await bus.emit("context.updated", {});
      unsubscribe();
      await bus.emit("context.updated", {});

      assert.equal(callCount, 1);
    });

    it("should unsubscribe with off()", async () => {
      let callCount = 0;
      const handler = () => callCount++;

      bus.on("context.updated", handler);
      await bus.emit("context.updated", {});
      bus.off("context.updated", handler);
      await bus.emit("context.updated", {});

      assert.equal(callCount, 1);
    });

    it("should handle multiple handlers for same event", async () => {
      let count1 = 0;
      let count2 = 0;

      bus.on("context.updated", () => count1++);
      bus.on("context.updated", () => count2++);

      await bus.emit("context.updated", {});

      assert.equal(count1, 1);
      assert.equal(count2, 1);
    });

    it("should receive event payload data", async () => {
      let receivedData: unknown;
      bus.on<{ name: string }>("context.updated", (payload) => {
        receivedData = payload.data;
      });

      await bus.emit("context.updated", { name: "test" });
      assert.deepEqual(receivedData, { name: "test" });
    });

    it("should include metadata in payload", async () => {
      let receivedPayload: EventPayload | undefined;
      bus.on("context.updated", (payload) => {
        receivedPayload = payload;
      });

      await bus.emit("context.updated", { value: 1 }, "source-123");

      assert.ok(receivedPayload);
      assert.equal(receivedPayload!.type, "context.updated");
      assert.equal(receivedPayload!.channel, "context");
      assert.equal(receivedPayload!.source, "source-123");
      assert.ok(typeof receivedPayload!.timestamp === "number");
    });
  });

  describe("onChannel() and offChannel()", () => {
    it("should receive all events on a channel", async () => {
      let count = 0;
      bus.onChannel("context", () => count++);

      await bus.emit("context.updated", {});
      await bus.emit("context.compacted", {});

      assert.equal(count, 2);
    });

    it("should only receive events for subscribed channel", async () => {
      let contextCount = 0;
      let memoryCount = 0;

      bus.onChannel("context", () => contextCount++);
      bus.onChannel("memory", () => memoryCount++);

      await bus.emit("context.updated", {});
      await bus.emit("memory.stored", {});

      assert.equal(contextCount, 1);
      assert.equal(memoryCount, 1);
    });

    it("should unsubscribe from channel", async () => {
      let count = 0;
      const handler = () => count++;

      bus.onChannel("context", handler);
      bus.offChannel("context", handler);

      await bus.emit("context.updated", {});

      assert.equal(count, 0);
    });
  });

  describe("onAny()", () => {
    it("should receive all events", async () => {
      let count = 0;
      bus.onAny(() => count++);

      await bus.emit("context.updated", {});
      await bus.emit("memory.stored", {});
      await bus.emit("config.changed", {});

      assert.equal(count, 3);
    });

    it("should return unsubscribe function", async () => {
      let count = 0;
      const unsubscribe = bus.onAny(() => count++);

      await bus.emit("context.updated", {});
      unsubscribe();
      await bus.emit("context.updated", {});

      assert.equal(count, 1);
    });
  });

  describe("emit()", () => {
    it("should correctly derive channel from event type", async () => {
      const channels: EventChannel[] = [];

      bus.onChannel("context", () => channels.push("context"));
      bus.onChannel("memory", () => channels.push("memory"));
      bus.onChannel("config", () => channels.push("config"));
      bus.onChannel("error", () => channels.push("error"));
      bus.onChannel("state", () => channels.push("state"));

      await bus.emit("context.updated", {});
      await bus.emit("context.compacted", {});
      await bus.emit("memory.stored", {});
      await bus.emit("memory.retrieved", {});
      await bus.emit("config.changed", {});
      await bus.emit("error.occurred", {});
      await bus.emit("state.changed", {});

      assert.equal(channels.filter((c) => c === "context").length, 2);
      assert.equal(channels.filter((c) => c === "memory").length, 2);
      assert.equal(channels.filter((c) => c === "config").length, 1);
      assert.equal(channels.filter((c) => c === "error").length, 1);
      assert.equal(channels.filter((c) => c === "state").length, 1);
    });

    it("should handle async handlers", async () => {
      let resolved = false;
      bus.on("context.updated", async () => {
        await new Promise((r) => setTimeout(r, 10));
        resolved = true;
      });

      await bus.emit("context.updated", {});
      assert.ok(resolved);
    });

    it("should continue even if handler throws", async () => {
      let errorHandlerCount = 0;
      let normalHandlerCount = 0;

      bus.on("context.updated", () => {
        throw new Error("Handler error");
      });
      bus.on("context.updated", () => {
        normalHandlerCount++;
      });
      bus.on("error.occurred", () => {
        errorHandlerCount++;
      });

      // Should not throw
      await bus.emit("context.updated", {});

      // Normal handler should have been called
      assert.equal(normalHandlerCount, 1);
    });
  });

  describe("clear()", () => {
    it("should remove all handlers", async () => {
      bus.on("context.updated", () => {});
      bus.on("memory.stored", () => {});
      bus.onChannel("config", () => {});
      bus.onAny(() => {});

      bus.clear();

      assert.equal(bus.getHandlerCount(), 0);
    });

    it("should not receive events after clear", async () => {
      let count = 0;
      bus.on("context.updated", () => count++);

      await bus.emit("context.updated", {});
      bus.clear();
      await bus.emit("context.updated", {});

      assert.equal(count, 1);
    });
  });

  describe("getHandlerCount()", () => {
    it("should return 0 for new bus", () => {
      assert.equal(bus.getHandlerCount(), 0);
    });

    it("should count event type handlers", () => {
      bus.on("context.updated", () => {});
      bus.on("context.updated", () => {});

      assert.equal(bus.getHandlerCount("context.updated"), 2);
    });

    it("should count all handlers when no type specified", () => {
      bus.on("context.updated", () => {});
      bus.on("memory.stored", () => {});
      bus.onChannel("config", () => {});

      assert.equal(bus.getHandlerCount(), 3);
    });

    it("should return 0 for non-existent event type", () => {
      assert.equal(bus.getHandlerCount("nonexistent.event"), 0);
    });
  });

  describe("createEventBus()", () => {
    it("should create a new EventBus instance", () => {
      const created = createEventBus();
      assert.ok(created instanceof EventBus);
    });

    it("should create bus with debug option", () => {
      const debugBus = createEventBus({ debug: true });
      assert.ok(debugBus instanceof EventBus);
    });
  });

  describe("getGlobalEventBus()", () => {
    it("should return same instance on multiple calls", () => {
      const bus1 = getGlobalEventBus();
      const bus2 = getGlobalEventBus();

      assert.strictEqual(bus1, bus2);
    });
  });

  describe("debug mode", () => {
    it("should not throw in debug mode", async () => {
      const debugBus = new EventBus({ debug: true });

      debugBus.on("context.updated", () => {});

      // Should not throw even with console.log
      await debugBus.emit("context.updated", { data: "test" });

      // Handler should still work
      assert.ok(true);
    });
  });
});
