import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ProductService } from "../src/services/product.service";
import { ProductRepository } from "../src/repositories/product.repository";

describe("ProductService", () => {
  let service: ProductService;
  let mockRepo: any;

  beforeEach(() => {
    // 1. Mock the repository layer
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock((id: number) => Promise.resolve({ id, name: "Test Product" })),
      create: mock((data: any) => Promise.resolve({ id: 1, ...data })),
      update: mock((id: number, data: any) => Promise.resolve({ id, ...data })),
      delete: mock((id: number) => Promise.resolve({ id })),
    };

    // 2. Inject mock repo into the service
    service = new ProductService(mockRepo as unknown as ProductRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return an array of items", async () => {
    const result = await service.findAll();
    expect(result).toBeInstanceOf(Array);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it("should return a single item by id", async () => {
    const result = await service.findById(1);
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name", "Test Product");
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  // TODO: Add more business logic tests here
});
