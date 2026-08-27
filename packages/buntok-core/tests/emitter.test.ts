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

	describe("emitSerial", () => {
		it("should emit listeners serially", async () => {
			const order: number[] = [];
			emitter.on("test", async () => {
				await new Promise((r) => setTimeout(r, 10));
				order.push(1);
			});
			emitter.on("test", async () => {
				order.push(2);
			});

			await emitter.emitSerial("test", {});

			expect(order).toEqual([1, 2]);
		});

		it("should stop on first error", async () => {
			const order: number[] = [];
			emitter.on("test", () => {
				order.push(1);
				throw new Error("error 1");
			});
			emitter.on("test", () => {
				order.push(2);
			});

			await expect(emitter.emitSerial("test", {})).rejects.toThrow("error 1");
			expect(order).toEqual([1]);
		});

		it("should continue on error with isolatedErrors", async () => {
			const order: number[] = [];
			emitter.on("test", () => {
				order.push(1);
				throw new Error("error 1");
			});
			emitter.on("test", () => {
				order.push(2);
			});

			await emitter.emitSerial("test", {}, { isolatedErrors: true });
			expect(order).toEqual([1, 2]);
		});
	});

	describe("emit with error isolation", () => {
		it("should reject if any listener fails (default)", async () => {
			emitter.on("test", () => {});
			emitter.on("test", () => {
				throw new Error("test error");
			});

			await expect(emitter.emit("test", {})).rejects.toThrow("test error");
		});

		it("should not reject other listeners with isolatedErrors", async () => {
			const handler2 = mock(() => {});
			emitter.on("test", () => {
				throw new Error("test error");
			});
			emitter.on("test", handler2);

			await emitter.emit("test", {}, { isolatedErrors: true });

			expect(handler2).toHaveBeenCalledTimes(1);
		});

		it("should call onError callback for failed listeners", async () => {
			const onError = mock(() => {});
			const error = new Error("test error");

			emitter.on("test", () => {
				throw error;
			});

			await emitter.emit("test", {}, { isolatedErrors: true, onError });

			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenCalledWith("test", error, expect.any(Function));
		});
	});

	describe("maxListeners", () => {
		it("should throw when maxListeners exceeded", () => {
			const emitter = new EventEmitter({ maxListeners: 2 });
			emitter.on("test", () => {});
			emitter.on("test", () => {});

			expect(() => emitter.on("test", () => {})).toThrow("Max listeners (2) exceeded");
		});

		it("should allow increasing maxListeners", () => {
			const emitter = new EventEmitter({ maxListeners: 2 });
			emitter.increaseMaxListeners(5);

			emitter.on("test", () => {});
			emitter.on("test", () => {});
			emitter.on("test", () => {});

			expect(emitter.listenerCount("test")).toBe(3);
		});

		it("should return maxListeners", () => {
			const emitter = new EventEmitter({ maxListeners: 5 });
			expect(emitter.getMaxListeners()).toBe(5);
		});
	});

	describe("eventNames", () => {
		it("should return event names with listeners", () => {
			emitter.on("test1", () => {});
			emitter.on("test2", () => {});
			emitter.on("test3", () => {});

			const names = emitter.eventNames();
			expect(names).toContain("test1");
			expect(names).toContain("test2");
			expect(names).toContain("test3");
			expect(names.length).toBe(3);
		});
	});
});
