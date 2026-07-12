import { drizzle } from "drizzle-orm/node-postgres";
// Mock database connection for example project
// In a real app, use a real connection string (e.g., from process.env.DATABASE_URL)
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/buntok",
});

export const db = drizzle(pool);
