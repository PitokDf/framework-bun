import { connect } from "buntok";

const db = await connect({
  driver: "postgres",
  url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/buntok",
});

export { db };