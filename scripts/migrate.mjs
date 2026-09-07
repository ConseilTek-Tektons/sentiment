import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const directory = path.join(process.cwd(), "db", "migrations");
const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

await sql`create table if not exists schema_migration (name text primary key, applied_at timestamptz not null default now())`;
for (const file of files) {
  const [applied] = await sql`select name from schema_migration where name = ${file}`;
  if (applied) continue;
  const source = await readFile(path.join(directory, file), "utf8");
  await sql.begin(async (transaction) => {
    await transaction.unsafe(source);
    await transaction`insert into schema_migration (name) values (${file})`;
  });
  console.info(`Applied ${file}`);
}
await sql.end();
