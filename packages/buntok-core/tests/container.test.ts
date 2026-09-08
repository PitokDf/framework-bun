import { describe, it, expect, beforeEach } from "bun:test";
import { Container, Dependencies } from "../src/container";

class Database {
	connected = true;
}

class UserService {
	db: Database;
	constructor(db: Database) {
		this.db = db;
	}
}

// ── scan() test classes ─────────────────────────────────────────────

class UserRepo {
	findAll() {
		return [{ id: 1 }];
	}
}

@Dependencies(UserRepo)
class UserServiceAuto {
	repo: UserRepo;
	constructor(repo: UserRepo) {
		this.repo = repo;
	}
	getUsers() {
		return this.repo.findAll();
	}
}

@Dependencies(UserServiceAuto)
class UserControllerAuto {
	service: UserServiceAuto;
	constructor(service: UserServiceAuto) {
		this.service = service;
	}
	list() {
		return this.service.getUsers();
	}
}

// Deeper chain: Controller → Service → Repo + ExternalService
class ExternalService {
	send() {
		return "sent";
	}
}

class OrderRepo {
	create() {
		return { id: 1 };
	}
}

@Dependencies(OrderRepo, ExternalService)
class OrderService {
	constructor(private orderRepo: OrderRepo, private ext: ExternalService) {}
	create() {
		return this.orderRepo.create();
	}
}

@Dependencies(OrderService)
class OrderController {
	constructor(private orderService: OrderService) {}
	create() {
		return this.orderService.create();
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

	// ── scan() tests ───────────────────────────────────────────────

	describe("scan()", () => {
		it("should auto-register transitive dependencies from @Dependencies", () => {
			container.scan([UserControllerAuto]);

			expect(container.has(UserRepo)).toBe(true);
			expect(container.has(UserServiceAuto)).toBe(true);
			expect(container.has(UserControllerAuto)).toBe(true);
		});

		it("should resolve the full dependency chain", () => {
			container.scan([UserControllerAuto]);

			const controller = container.resolve<UserControllerAuto>(UserControllerAuto);
			expect(controller).toBeInstanceOf(UserControllerAuto);
			expect(controller.service).toBeInstanceOf(UserServiceAuto);
			expect(controller.service.repo).toBeInstanceOf(UserRepo);
		});

		it("should share singleton instances", () => {
			container.scan([UserControllerAuto]);

			const c1 = container.resolve<UserControllerAuto>(UserControllerAuto);
			const c2 = container.resolve<UserControllerAuto>(UserControllerAuto);
			expect(c1).toBe(c2);
			expect(c1.service).toBe(c2.service);
		});

		it("should resolve deeper chains (4 levels)", () => {
			container.scan([OrderController]);

			const controller = container.resolve<OrderController>(OrderController);
			expect(controller).toBeInstanceOf(OrderController);
			expect(controller.orderService).toBeInstanceOf(OrderService);
			expect(controller.orderService.orderRepo).toBeInstanceOf(OrderRepo);
			expect(controller.orderService.ext).toBeInstanceOf(ExternalService);
		});

		it("should resolve multiple root classes", () => {
			container.scan([UserControllerAuto, OrderController]);

			const userCtrl = container.resolve<UserControllerAuto>(UserControllerAuto);
			const orderCtrl = container.resolve<OrderController>(OrderController);
			expect(userCtrl).toBeInstanceOf(UserControllerAuto);
			expect(orderCtrl).toBeInstanceOf(OrderController);
		});

		it("should not re-register manually registered tokens", () => {
			container.register(UserRepo, {
				useFactory: () => ({ findAll: () => [{ id: 999 }] } as any),
			});

			container.scan([UserControllerAuto]);

			const repo = container.resolve<UserRepo>(UserRepo);
			expect(repo.findAll()).toEqual([{ id: 999 }]); // manual registration kept
		});

		it("should support transient scope", () => {
			container.scan([UserControllerAuto], "transient");

			const c1 = container.resolve<UserControllerAuto>(UserControllerAuto);
			const c2 = container.resolve<UserControllerAuto>(UserControllerAuto);
			expect(c1).not.toBe(c2);
		});

		it("should return this for chaining", () => {
			const result = container.scan([UserControllerAuto]);
			expect(result).toBe(container);
		});

		it("should handle classes with no constructor params", () => {
			@Dependencies()
			class SimpleClass {}

			container.scan([SimpleClass]);
			const instance = container.resolve<SimpleClass>(SimpleClass);
			expect(instance).toBeInstanceOf(SimpleClass);
		});

		it("should throw for circular dependencies detected by scan", () => {
			class A {
				declare b: B;
			}
			class B {
				declare a: A;
			}
			// Manually set dependencies for circular case
			Dependencies(B)(A as any, { kind: "class" } as any);
			Dependencies(A)(B as any, { kind: "class" } as any);

			container.scan([A]);

			expect(() => container.resolve(A)).toThrow("Circular dependency");
		});
	});
});
