import { db } from "../db";
import { product, type Product, type NewProduct } from "../db/schemas/product";
import { eq } from "drizzle-orm";

export class ProductRepository {
  async findAll(): Promise<Product[]> {
    return db.select().from(product);
  }

  async findById(id: string): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(product)
      .where(eq(product.id, id))
      .limit(1);
    return result[0];
  }

  async create(data: NewProduct): Promise<Product> {
    const result = await db.insert(product).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewProduct>): Promise<Product | undefined> {
    const result = await db
      .update(product)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(product.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(product)
      .where(eq(product.id, id))
      .returning();
    return result.length > 0;
  }
}
