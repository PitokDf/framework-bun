import type { DatabaseConfig } from "buntok";

export default {
  driver: "postgres",
  url: Bun.env.DATABASE_URL || "postgresql://localhost:5432/buntok",
} satisfies DatabaseConfig;