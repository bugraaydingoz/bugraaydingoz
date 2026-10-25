import process from "node:process";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDatabase } from "./db";
import { startRuntime } from "./runtime";

const database = process.env.DATABASE_URL ? createDatabase() : undefined;

const runtime =
  database && process.env.REDIS_URL
    ? await startRuntime(database, process.env.SIMULATOR_ENABLED !== "false")
    : undefined;

const app = createApp({
  database,
  hub: runtime?.hub,
  checkDatabase: database?.check,
  checkMessaging: database
    ? async () => {
        if (!runtime) throw new Error("Redis is not configured");

        await runtime.check();
      }
    : undefined,
});

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) =>
  console.log(`Server running on http://localhost:${info.port}`),
);

let stopping = false;

async function shutdown() {
  if (stopping) return;

  stopping = true;

  const deadline = setTimeout(() => process.exit(1), 20_000);

  deadline.unref();

  try {
    await runtime?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await database?.close();
    clearTimeout(deadline);
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

process.once("SIGINT", () => void shutdown());

process.once("SIGTERM", () => void shutdown());
