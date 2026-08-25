import { describe, it, expect, beforeEach, mock } from "bun:test";
import { BaseService } from "../src/base-service";
import { NotFoundError } from "../src/helpers/async-handler";

interface TestItem {
	id: string | number;
	name: string;
}

function createMockRepository() {
	return {
		findAll: mock(() => Promise.resolve([])),
		findById: mock((id: string | number) =>
			Promise.resolve(id === "1" ? { id: "1", name: "Item 1" } : null),
		),
		create: mock((data: any) => Promise.resolve({ id: "2", ...data })),
		update: mock((id: string | number, data: any) =>
			Promise.resolve({ id, ...data }),
		),
		delete: mock((id: string | number) =>
			Promise.resolve({ id, name: "Deleted" }),
		),
		count: mock(() => Promise.resolve(5)),
	};
}

class TestService extends BaseService<TestItem> {
	constructor(repo: ReturnType<typeof createMockRepository>) {
		super(repo);
	}
}

describe("BaseService", () => {
	let service: TestService;
	let mockRepo: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepo = createMockRepository();
		service = new TestService(mockRepo);
	});

	it("should call repository.findAll on getAll", async () => {
		const result = await service.getAll();
		expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
		expect(result).toBeInstanceOf(Array);
	});

	it("should call repository.findById on getById", async () => {
		const result = await service.getById("1");
		expect(mockRepo.findById).toHaveBeenCalledWith("1");
		expect(result).toHaveProperty("id", "1");
		expect(result).toHaveProperty("name", "Item 1");
	});

	it("should throw NotFoundError when item not found", async () => {
		try {
			await service.getById("999");
			expect(true).toBe(false); // Should not reach here
		} catch (e) {
			expect(e).toBeInstanceOf(NotFoundError);
			expect((e as NotFoundError).message).toContain("999");
		}
	});

	it("should call repository.create on create", async () => {
		const result = await service.create({ name: "New Item" });
		expect(mockRepo.create).toHaveBeenCalledWith({ name: "New Item" });
		expect(result).toHaveProperty("name", "New Item");
	});

	it("should call repository.update on update after finding item", async () => {
		const result = await service.update("1", { name: "Updated" });
		expect(mockRepo.findById).toHaveBeenCalledWith("1");
		expect(mockRepo.update).toHaveBeenCalledWith("1", { name: "Updated" });
		expect(result).toHaveProperty("name", "Updated");
	});

	it("should throw NotFoundError when updating non-existent item", async () => {
		try {
			await service.update("999", { name: "Updated" });
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(NotFoundError);
		}
	});

	it("should call repository.delete on delete after finding item", async () => {
		const result = await service.delete("1");
		expect(mockRepo.findById).toHaveBeenCalledWith("1");
		expect(mockRepo.delete).toHaveBeenCalledWith("1");
		expect(result).toHaveProperty("name", "Deleted");
	});

	it("should throw NotFoundError when deleting non-existent item", async () => {
		try {
			await service.delete("999");
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(NotFoundError);
		}
	});

	it("should call repository.count on count", async () => {
		const result = await service.count();
		expect(mockRepo.count).toHaveBeenCalledTimes(1);
		expect(result).toBe(5);
	});
});
