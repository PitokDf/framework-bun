import { describe, it, expect, beforeEach } from "bun:test";
import { Container } from "../src/container";

class Database {
	connected = true;
}

class UserService {
	db: Database;
	constructor(db: Database) {
		this.db = db;
	}
}

describe("Container", () => {
	let container: Container;

	beforeEach(() => {
		container = new Container();
	});

	it("should register and resolve a value provider", () => {
		container.register("apiKey", { useValue: "abc123" });
		expect(container.resolve<string>("apiKey")).toBe("abc123");
	});

	it("should register and resolve a class provider (singleton)", () => {
		container.register("db", { useClass: Database });
		const db1 = container.resolve<Database>("db");
		const db2 = container.resolve<Database>("db");
		expect(db1).toBe(db2); // Same reference
		expect(db1.connected).toBe(true);
	});

	it("should register and resolve a transient class provider", () => {
		container.register("db", { useClass: Database, scope: "transient" });
		const db1 = container.resolve<Database>("db");
		const db2 = container.resolve<Database>("db");
		expect(db1).not.toBe(db2); // Different instances
	});

	it("should register and resolve a factory provider", () => {
		container.register("timestamp", {
			useFactory: () => Date.now(),
		});
		const ts = container.resolve<number>("timestamp");
		expect(typeof ts).toBe("number");
	});

	it("should registerClass by constructor", () => {
		container.registerClass(Database);
		expect(container.has(Database)).toBe(true);
		const db = container.resolve<Database>(Database);
		expect(db).toBeInstanceOf(Database);
	});

	it("should return undefined for unregistered token in get()", () => {
		expect(container.get("nonexistent")).toBeUndefined();
	});

	it("should check if token is registered with has()", () => {
		container.register("key", { useValue: "val" });
		expect(container.has("key")).toBe(true);
		expect(container.has("other")).toBe(false);
	});

	it("should check if token is resolved with hasResolved()", () => {
		container.register("key", { useValue: "val" });
		expect(container.hasResolved("key")).toBe(false);
		container.resolve("key");
		expect(container.hasResolved("key")).toBe(true);
	});

	it("should clear all providers and instances", () => {
		container.register("key", { useValue: "val" });
		container.resolve("key");
		container.clear();
		expect(container.has("key")).toBe(false);
		expect(container.hasResolved("key")).toBe(false);
	});

	it("should throw for circular dependency", () => {
		class A {
			declare b: B;
		}
		class B {
			declare a: A;
		}
		// Register without using decorators to manually create circular deps
		container.register("a", {
			useClass: A,
			scope: "singleton",
		});
		container.register("b", {
			useClass: B,
			scope: "singleton",
		});

		// Manually create circular reference
		const a = container.resolve<A>("a");
		const b = container.resolve<B>("b");
		a.b = b;
		b.a = a;

		// This won't throw because they're already resolved
		// But registering new circular deps should throw
		container.clear();
		container.register("x", {
			useFactory: (c) => ({ dep: c.resolve("y") }),
		});
		container.register("y", {
			useFactory: (c) => ({ dep: c.resolve("x") }),
		});

		expect(() => container.resolve("x")).toThrow("Circular dependency");
	});

	it("should throw for unregistered token", () => {
		expect(() => container.resolve("nonexistent")).toThrow(
			"No provider registered for",
		);
	});
});
