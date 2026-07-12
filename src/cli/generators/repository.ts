import { toSnakeCase } from "../utils.js";

export function generateRepository(
	entityName: string,
	pascalName: string,
	withSchema: boolean = true,
): string {
	const tableName = toSnakeCase(entityName);

	if (withSchema) {
		return `import { db } from "../db";
import { ${tableName}, type ${pascalName}, type New${pascalName} } from "../db/schemas/${entityName}";
import { eq } from "drizzle-orm";

export class ${pascalName}Repository {
  async findAll(): Promise<${pascalName}[]> {
    return db.select().from(${tableName});
  }

  async findById(id: string): Promise<${pascalName} | undefined> {
    const result = await db
      .select()
      .from(${tableName})
      .where(eq(${tableName}.id, id))
      .limit(1);
    return result[0];
  }

  async create(data: New${pascalName}): Promise<${pascalName}> {
    const result = await db.insert(${tableName}).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<New${pascalName}>): Promise<${pascalName} | undefined> {
    const result = await db
      .update(${tableName})
      .set({ ...data, updatedAt: new Date() })
      .where(eq(${tableName}.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(${tableName})
      .where(eq(${tableName}.id, id))
      .returning();
    return result.length > 0;
  }
}
`;
	}

	return `export class ${pascalName}Repository {
  private data: any[] = [];

  async findAll(): Promise<any[]> {
    return this.data;
  }

  async findById(id: string): Promise<any | undefined> {
    return this.data.find(item => item.id === id);
  }

  async create(data: any): Promise<any> {
    const newItem = { id: crypto.randomUUID(), ...data };
    this.data.push(newItem);
    return newItem;
  }

  async update(id: string, data: any): Promise<any | undefined> {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...data, updatedAt: new Date() };
      return this.data[index];
    }
    return undefined;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    return this.data.length < initialLength;
  }
}
`;
}
