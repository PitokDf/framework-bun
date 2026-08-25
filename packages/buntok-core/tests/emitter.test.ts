import { describe, expect, it, mock, beforeEach } from "bun:test";
import { EventEmitter } from "../src/emitter";

describe("EventEmitter", () => {
	let emitter: EventEmitter;

	beforeEach(() => {
		emitter = new EventEmitter();
	});

	it("should subscribe and emit events", async () => {
		const handler = mock(() => {});
		emitter.on("test", handler);

		await emitter.emit("test", { data: 1 });

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith({ data: 1 });
	});

	it("should support multiple listeners", async () => {
		const handler1 = mock(() => {});
		const handler2 = mock(() => {});

		emitter.on("test", handler1);
		emitter.on("test", handler2);

		await emitter.emit("test", { data: 1 });

		expect(handler1).toHaveBeenCalledTimes(1);
		expect(handler2).toHaveBeenCalledTimes(1);
	});

	it("should return unsubscribe function", async () => {
		const handler = mock(() => {});
		const unsub = emitter.on("test", handler);

		unsub();
		await emitter.emit("test", { data: 1 });

		expect(handler).not.toHaveBeenCalled();
	});

	it("should support once listener", async () => {
		const handler = mock(() => {});
		emitter.once("test", handler);

		await emitter.emit("test", { data: 1 });
		await emitter.emit("test", { data: 2 });

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith({ data: 1 });
	});

	it("should clear all listeners with off()", async () => {
		const handler1 = mock(() => {});
		const handler2 = mock(() => {});

		emitter.on("test", handler1);
		emitter.on("test2", handler2);

		emitter.off();

		await emitter.emit("test", {});
		await emitter.emit("test2", {});

		expect(handler1).not.toHaveBeenCalled();
		expect(handler2).not.toHaveBeenCalled();
	});

	it("should clear specific event listeners with off(event)", async () => {
		const handler1 = mock(() => {});
		const handler2 = mock(() => {});

		emitter.on("test1", handler1);
		emitter.on("test2", handler2);

		emitter.off("test1");

		await emitter.emit("test1", {});
		await emitter.emit("test2", {});

		expect(handler1).not.toHaveBeenCalled();
		expect(handler2).toHaveBeenCalledTimes(1);
	});

	it("should return listener count", () => {
		emitter.on("test", () => {});
		emitter.on("test", () => {});
		emitter.on("test2", () => {});

		expect(emitter.listenerCount("test")).toBe(2);
		expect(emitter.listenerCount("test2")).toBe(1);
		expect(emitter.listenerCount("other")).toBe(0);
	});

	it("should handle async listeners", async () => {
		const results: number[] = [];
		emitter.on("test", async () => {
			await new Promise((r) => setTimeout(r, 10));
			results.push(1);
		});
		emitter.on("test", async () => {
			results.push(2);
		});

		await emitter.emit("test", {});

		expect(results).toEqual([2, 1]);
	});

	it("should return void for events with no listeners", async () => {
		// Should not throw
		await emitter.emit("nonexistent", {});
	});

	it("should handle errors in listeners gracefully", async () => {
		emitter.on("test", async () => {
			throw new Error("test error");
		});

		// Should throw the error
		expect(emitter.emit("test", {})).rejects.toThrow("test error");
	});

	it("should support typed events", async () => {
		interface TestEvents {
			"user:created": { id: number; name: string };
			"user:deleted": { id: number };
		}

		const typedEmitter = new EventEmitter<TestEvents>();
		const handler = mock((data: { id: number; name: string }) => {});

		typedEmitter.on("user:created", handler);
		await typedEmitter.emit("user:created", { id: 1, name: "test" });

		expect(handler).toHaveBeenCalledWith({ id: 1, name: "test" });
	});
});
