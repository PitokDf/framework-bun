import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { validateWSMessage, Room } from "../src/ws-helpers";

describe("validateWSMessage", () => {
	const messageSchema = z.object({
		type: z.enum(["chat", "ping", "join"]),
		payload: z.string().optional(),
	});

	it("should validate valid JSON message", () => {
		const result = validateWSMessage(messageSchema, '{"type": "chat", "payload": "hello"}');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ type: "chat", payload: "hello" });
		}
	});

	it("should return errors for invalid JSON", () => {
		const result = validateWSMessage(messageSchema, "invalid json");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.issues[0].message).toBe("Invalid JSON");
		}
	});

	it("should return errors for invalid schema", () => {
		const result = validateWSMessage(messageSchema, '{"type": "invalid"}');

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.issues.length).toBeGreaterThan(0);
		}
	});

	it("should handle Buffer input", () => {
		const buffer = Buffer.from('{"type": "ping"}');
		const result = validateWSMessage(messageSchema, buffer);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ type: "ping" });
		}
	});

	it("should handle optional fields", () => {
		const result = validateWSMessage(messageSchema, '{"type": "join"}');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ type: "join" });
		}
	});
});

describe("Room", () => {
	it("should create a room with name", () => {
		const room = new Room("test-room");
		expect(room.name).toBe("test-room");
		expect(room.size).toBe(0);
		expect(room.isEmpty).toBe(true);
	});

	it("should track members (mock WebSocket)", () => {
		const room = new Room("test-room");
		const ws1 = { readyState: 1 } as any;
		const ws2 = { readyState: 1 } as any;

		room.join(ws1);
		expect(room.size).toBe(1);
		expect(room.has(ws1)).toBe(true);

		room.join(ws2);
		expect(room.size).toBe(2);

		room.leave(ws1);
		expect(room.size).toBe(1);
		expect(room.has(ws1)).toBe(false);
		expect(room.has(ws2)).toBe(true);
	});

	it("should broadcast to all members except sender", () => {
		const room = new Room("test-room");
		const messages1: string[] = [];
		const messages2: string[] = [];

		const ws1 = {
			readyState: 1,
			send: (msg: string) => messages1.push(msg),
		} as any;
		const ws2 = {
			readyState: 1,
			send: (msg: string) => messages2.push(msg),
		} as any;

		room.join(ws1);
		room.join(ws2);

		room.broadcast("hello", ws1);

		expect(messages1).toHaveLength(0);
		expect(messages2).toEqual(["hello"]);
	});

	it("should send to all members", () => {
		const room = new Room("test-room");
		const messages1: string[] = [];
		const messages2: string[] = [];

		const ws1 = {
			readyState: 1,
			send: (msg: string) => messages1.push(msg),
		} as any;
		const ws2 = {
			readyState: 1,
			send: (msg: string) => messages2.push(msg),
		} as any;

		room.join(ws1);
		room.join(ws2);

		room.sendAll("hello");

		expect(messages1).toEqual(["hello"]);
		expect(messages2).toEqual(["hello"]);
	});

	it("should not send to closed connections", () => {
		const room = new Room("test-room");
		const messages: string[] = [];

		const ws = {
			readyState: 3, // CLOSED
			send: (msg: string) => messages.push(msg),
		} as any;

		room.join(ws);
		room.sendAll("hello");

		expect(messages).toHaveLength(0);
	});

	it("should get members list", () => {
		const room = new Room("test-room");
		const ws1 = { readyState: 1 } as any;
		const ws2 = { readyState: 1 } as any;

		room.join(ws1);
		room.join(ws2);

		const members = room.getMembers();
		expect(members).toHaveLength(2);
		expect(members).toContain(ws1);
		expect(members).toContain(ws2);
	});

	it("should close all connections", () => {
		const room = new Room("test-room");
		const ws1 = {
			readyState: 1,
			close: (code: number, reason: string) => {},
		} as any;
		const ws2 = {
			readyState: 1,
			close: (code: number, reason: string) => {},
		} as any;

		room.join(ws1);
		room.join(ws2);

		room.closeAll();

		expect(room.size).toBe(0);
		expect(room.isEmpty).toBe(true);
	});
});
