import postgres, { type Sql } from "postgres";

const globalDatabase = globalThis as unknown as { appSql?: Sql };

export function database(): Sql {
  if (!globalDatabase.appSql) {
    const options = {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: process.env.DATABASE_SSL === "true" ? "require" as const : false,
      transform: postgres.camel,
    };

    if (process.env.DATABASE_URL) {
      globalDatabase.appSql = postgres(process.env.DATABASE_URL, options);
    } else if (process.env.PGHOST) {
      globalDatabase.appSql = postgres({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ...options,
      });
    } else {
      throw new Error("DATABASE_URL or PGHOST is not configured");
    }
  }
  return globalDatabase.appSql;
}
