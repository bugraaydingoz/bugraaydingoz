import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { databaseUrl } from "./db";

export async function migrateDatabase(value?: string) {
  const client = postgres(databaseUrl(value), {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 0,
    max_lifetime: 0,
    onnotice: () => {},
  });

  try {
    // A single connection retains this session lock until client.end().
    // Concurrent deployments wait before inspecting Drizzle's migration journal.
    await client`select pg_advisory_lock(hashtext('robofleet:migrations'))`;
    await migrate(drizzle(client), {
      migrationsFolder: fileURLToPath(new URL("../drizzle/migrations", import.meta.url)),
    });
  } finally {
    await client.end({ timeout: 5 });
  }
}
