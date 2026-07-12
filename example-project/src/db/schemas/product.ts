import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // TODO: Add your columns here
  // Example:
  // name: varchar("name", { length: 255 }).notNull(),
  // email: varchar("email", { length: 255 }).notNull().unique(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
