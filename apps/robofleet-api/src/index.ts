import process from "node:process";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDatabase } from "./db";

const database = process.env.DATABASE_URL ? createDatabase() : undefined;
const app = createApp({ checkDatabase: database?.check });

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

function shutdown() {
  server.close(() => {
    void (database?.close() ?? Promise.resolve()).finally(() => process.exit(0));
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
