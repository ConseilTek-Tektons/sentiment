import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const source = await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8");
await sql.unsafe(source);
await sql.end();
console.info("Seed data applied");
