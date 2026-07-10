import { toSnakeCase } from "../utils.js";

export function generateRepository(entityName: string, pascalName: string): string {
  const tableName = toSnakeCase(entityName);
  
  return `import { db } from "../db";
import { ${tableName}, type ${pascalName}, type New${pascalName} } from "../db/schemas/${entityName}";

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

// Import eq from drizzle-orm
import { eq } from "drizzle-orm";
`;
}
