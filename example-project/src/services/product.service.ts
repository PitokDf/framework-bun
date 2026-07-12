import { ProductRepository } from "../repositories/product.repository";
import type { Product, NewProduct } from "../db/schemas/product";

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async getAll(): Promise<Product[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Product | undefined> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async create(data: NewProduct): Promise<Product> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<NewProduct>): Promise<Product> {
    const product = await this.repository.update(id, data);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Product not found");
    }
    return true;
  }
}
