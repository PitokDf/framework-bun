import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schemas/index";

// TODO: Update DATABASE_URL in .env file
// Example: DATABASE_URL=postgresql://user:password@localhost:5432/mydb

const connection = Bun.env.DATABASE_URL || "postgresql://localhost:5432/buntok";

export const db = drizzle(connection, { schema });
