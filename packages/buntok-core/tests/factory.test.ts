import { describe, it, expect } from "bun:test";
import { Factory } from "../src/factory";

describe("Factory", () => {
	interface User {
		id: number;
		name: string;
		email: string;
		role: "user" | "admin";
	}

	const UserFactory = Factory.define<User>(() => ({
		id: Math.floor(Math.random() * 10000),
		name: "Test User",
		email: "test@example.com",
		role: "user",
	}));

	describe("define", () => {
		it("should create a factory", () => {
			expect(UserFactory).toBeDefined();
		});
	});

	describe("build", () => {
		it("should generate a single item synchronously", () => {
			const user = UserFactory.build();
			expect(user).toHaveProperty("id");
			expect(user.name).toBe("Test User");
			expect(user.email).toBe("test@example.com");
		});

		it("should apply overrides", () => {
			const user = UserFactory.build({ name: "Custom", role: "admin" });
			expect(user.name).toBe("Custom");
			expect(user.role).toBe("admin");
		});

		it("should not mutate factory state", () => {
			UserFactory.build({ name: "Override" });
			const user2 = UserFactory.build();
			expect(user2.name).toBe("Test User");
		});
	});

	describe("buildMany", () => {
		it("should generate multiple items", () => {
			const users = UserFactory.buildMany(3);
			expect(users).toHaveLength(3);
			for (const user of users) {
				expect(user).toHaveProperty("id");
				expect(user.name).toBe("Test User");
			}
		});

		it("should apply overrides to all items", () => {
			const users = UserFactory.buildMany(2, { role: "admin" });
			for (const user of users) {
				expect(user.role).toBe("admin");
			}
		});

		it("should handle count of 0", () => {
			const users = UserFactory.buildMany(0);
			expect(users).toHaveLength(0);
		});
	});

	describe("withDefaults", () => {
		it("should set default overrides", () => {
			const AdminFactory = UserFactory.withDefaults({ role: "admin" });
			const user = AdminFactory.build();
			expect(user.role).toBe("admin");
		});

		it("should allow per-call overrides on top of defaults", () => {
			const AdminFactory = UserFactory.withDefaults({ role: "admin" });
			const user = AdminFactory.build({ name: "Super Admin" });
			expect(user.name).toBe("Super Admin");
			expect(user.role).toBe("admin");
		});

		it("should mutate original factory (returns this)", () => {
			const fresh = Factory.define<User>(() => ({
				id: 1,
				name: "Test",
				email: "test@test.com",
				role: "user",
			}));
			const before = fresh.build();
			fresh.withDefaults({ role: "admin" });
			const after = fresh.build();
			expect(before.role).toBe("user");
			expect(after.role).toBe("admin");
		});
	});

	describe("create", () => {
		it("should create an item asynchronously", async () => {
			const user = await UserFactory.create();
			expect(user).toHaveProperty("id");
			expect(user.name).toBe("Test User");
		});

		it("should apply overrides", async () => {
			const user = await UserFactory.create({ name: "Async User" });
			expect(user.name).toBe("Async User");
		});
	});

	describe("createMany", () => {
		it("should create multiple items", async () => {
			const users = await UserFactory.createMany(3);
			expect(users).toHaveLength(3);
		});

		it("should apply overrides to all", async () => {
			const users = await UserFactory.createMany(2, { name: "All Same" });
			for (const user of users) {
				expect(user.name).toBe("All Same");
			}
		});
	});

	describe("afterCreate", () => {
		it("should run callback after create", async () => {
			let hookCalled = false;
			let hookItem: User | null = null;

			const HookFactory = UserFactory.afterCreate((item) => {
				hookCalled = true;
				hookItem = item;
			});

			const user = await HookFactory.create({ name: "Hooked" });
			expect(hookCalled).toBe(true);
			expect(hookItem?.name).toBe("Hooked");
		});

		it("should run callback after createMany", async () => {
			let count = 0;

			const CountFactory = UserFactory.afterCreate(() => {
				count++;
			});

			await CountFactory.createMany(3);
			expect(count).toBe(3);
		});

		it("should support async callbacks", async () => {
			const AsyncFactory = UserFactory.afterCreate(async (item) => {
				item.name = "Modified";
			});

			const user = await AsyncFactory.create();
			expect(user.name).toBe("Modified");
		});

		it("should not run on build", () => {
			let hookCalled = false;
			UserFactory.afterCreate(() => {
				hookCalled = true;
			});

			UserFactory.build();
			expect(hookCalled).toBe(false);
		});
	});

	describe("Factory.ref", () => {
		it("should resolve lazy reference", () => {
			const postId = 42;
			const post = {
				id: 1,
				userId: Factory.ref(() => postId),
			};
			expect(post.userId).toBe(42);
		});

		it("should resolve reference to another factory", () => {
			const user = UserFactory.build();
			const post = {
				id: 1,
				userId: Factory.ref(() => user.id),
			};
			expect(post.userId).toBe(user.id);
		});
	});

	describe("Factory.pick", () => {
		it("should pick a single item from array", () => {
			const items = [1, 2, 3, 4, 5];
			const picked = Factory.pick(items);
			expect(items).toContain(picked);
		});

		it("should pick multiple items from array", () => {
			const items = [1, 2, 3, 4, 5];
			const picked = Factory.pick(items, 3);
			expect(picked).toHaveLength(3);
		});

		it("should throw on empty array", () => {
			expect(() => Factory.pick([])).toThrow("Cannot pick from empty array");
		});

		it("should not exceed array length when count is larger", () => {
			const items = [1, 2];
			const picked = Factory.pick(items, 5);
			expect(picked).toHaveLength(2);
		});
	});
});
