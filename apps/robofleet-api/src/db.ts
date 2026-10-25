import process from "node:process";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

export function databaseUrl(value = process.env.DATABASE_URL) {
  if (!value) throw new Error("DATABASE_URL is required for database commands");

  try {
    const url = new URL(value);

    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      !url.pathname.slice(1)
    ) {
      throw new Error("Invalid URL");
    }
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL URL with a host and database name");
  }

  return value;
}

export function createDatabase(value?: string) {
  const client = postgres(databaseUrl(value), { max: 5, connect_timeout: 5 });
  const db = drizzle(client, { schema });

  return {
    client,
    db,
    check: () => db.execute(sql`select 1`),
    close: () => client.end({ timeout: 5 }),
  };
}
