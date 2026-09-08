import { describe, it, expect, beforeEach } from "bun:test";
import { MemoryCacheDriver, Cache } from "../src/cache";

describe("MemoryCacheDriver", () => {
	let driver: MemoryCacheDriver;

	beforeEach(() => {
		driver = new MemoryCacheDriver();
	});

	it("should get and set values", async () => {
		await driver.set("key", "value");
		expect(await driver.get("key")).toBe("value");
	});

	it("should return null for missing keys", async () => {
		expect(await driver.get("missing")).toBeNull();
	});

	it("should delete keys", async () => {
		await driver.set("key", "value");
		await driver.delete("key");
		expect(await driver.get("key")).toBeNull();
	});

	it("should clear all keys", async () => {
		await driver.set("a", 1);
		await driver.set("b", 2);
		await driver.clear();
		expect(await driver.get("a")).toBeNull();
		expect(await driver.get("b")).toBeNull();
	});

	it("should return non-expired keys", async () => {
		await driver.set("key", "value", 60);
		expect(await driver.keys()).toEqual(["key"]);
	});

	it("should not return expired keys", async () => {
		await driver.set("key", "value", -1); // already expired
		expect(await driver.keys()).toEqual([]);
	});
});

describe("Cache", () => {
	let cache: Cache;

	beforeEach(() => {
		cache = new Cache();
	});

	it("should get and set values", async () => {
		await cache.set("name", "Alice");
		expect(await cache.get("name")).toBe("Alice");
	});

	it("should return null for missing keys", async () => {
		expect(await cache.get("missing")).toBeNull();
	});

	it("should delete keys", async () => {
		await cache.set("key", "value");
		await cache.delete("key");
		expect(await cache.get("key")).toBeNull();
	});

	it("should clear all keys", async () => {
		await cache.set("a", 1);
		await cache.set("b", 2);
		await cache.clear();
		expect(await cache.get("a")).toBeNull();
	});

	it("should check has()", async () => {
		await cache.set("key", "value");
		expect(await cache.has("key")).toBe(true);
		expect(await cache.has("missing")).toBe(false);
	});

	it("should return cached value from getOrSet", async () => {
		await cache.set("key", "cached");
		const result = await cache.getOrSet("key", async () => "factory", 60);
		expect(result).toBe("cached");
	});

	it("should call factory when cache miss", async () => {
		const result = await cache.getOrSet("key", async () => "factory", 60);
		expect(result).toBe("factory");
		expect(await cache.get("key")).toBe("factory");
	});

	it("should increment values", async () => {
		await cache.set("counter", 0);
		expect(await cache.increment("counter")).toBe(1);
		expect(await cache.increment("counter")).toBe(2);
	});

	it("should increment by custom amount", async () => {
		await cache.set("counter", 0);
		expect(await cache.increment("counter", 5)).toBe(5);
	});

	it("should decrement values", async () => {
		await cache.set("counter", 10);
		expect(await cache.decrement("counter")).toBe(9);
	});

	it("should get multiple keys", async () => {
		await cache.set("a", 1);
		await cache.set("b", 2);
		const result = await cache.mget(["a", "b", "c"]);
		expect(result).toEqual([1, 2, null]);
	});

	it("should set multiple keys", async () => {
		await cache.mset([["a", 1], ["b", 2]]);
		expect(await cache.get("a")).toBe(1);
		expect(await cache.get("b")).toBe(2);
	});

	it("should delete by pattern", async () => {
		await cache.set("session:1", "a");
		await cache.set("session:2", "b");
		await cache.set("user:1", "c");
		const count = await cache.deletePattern("session:*");
		expect(count).toBe(2);
		expect(await cache.get("session:1")).toBeNull();
		expect(await cache.get("user:1")).toBe("c");
	});

	it("should return all keys", async () => {
		await cache.set("a", 1);
		await cache.set("b", 2);
		const keys = await cache.keys();
		expect(keys.sort()).toEqual(["a", "b"]);
	});

	it("should respect TTL", async () => {
		await cache.set("key", "value", -1); // already expired
		expect(await cache.get("key")).toBeNull();
	});
});
