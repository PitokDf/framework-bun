import { connect } from "buntok";

const db = await connect({
  driver: "postgres",
  url: Bun.env.DATABASE_URL || "postgresql://localhost:5432/buntok",
});

export { db };