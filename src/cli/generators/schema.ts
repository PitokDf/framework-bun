import { toSnakeCase } from "../utils.js";

export function generateSchema(entityName: string): string {
	const tableName = toSnakeCase(entityName);
	const pascalName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

	return `import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const ${tableName} = pgTable("${tableName}", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // TODO: Add your columns here
  // Example:
  // name: varchar("name", { length: 255 }).notNull(),
  // email: varchar("email", { length: 255 }).notNull().unique(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ${pascalName} = typeof ${tableName}.$inferSelect;
export type New${pascalName} = typeof ${tableName}.$inferInsert;
`;
}
