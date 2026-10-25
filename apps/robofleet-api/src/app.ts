import type { Database } from "./maps/repository";
import type { EventHub } from "./events/hub";
import { createMapRepository } from "./maps/repository";
import { createRobotRepository } from "./robots/repository";
import { robotRoutes } from "./robots/routes";
import { mapRoutes } from "./maps/routes";
import { eventRoutes } from "./events/routes";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const healthQuery = z.object({
  check: z.string().default("ok"),
});

export function createApp({
  checkDatabase,
  checkMessaging,
  database,
  hub,
}: {
  checkDatabase?: () => Promise<unknown>;
  checkMessaging?: () => Promise<unknown>;
  database?: Database;
  hub?: EventHub;
} = {}) {
  const maps = database ? createMapRepository(database) : undefined;
  const robots = database ? createRobotRepository(database) : undefined;

  return new Hono()
    .onError((_error, c) => c.json({ error: "Request failed" }, 500))
    .use("/api/*", async (c, next) => {
      if (!database && !["/api/health", "/api/ready"].includes(c.req.path))
        return c.json({ error: "Fleet backend unavailable" }, 503);

      await next();
    })
    .route("/api", robotRoutes(robots!))
    .route("/api", mapRoutes(maps!))
    .route(
      "/api",
      eventRoutes(hub!, () => robots!.list()),
    )
    .get(
      "/api/health",
      zValidator("query", healthQuery, (result, c) => {
        if (!result.success) {
          return c.json({ error: "Invalid query parameters" }, 400);
        }
      }),
      (c) => c.json({ status: c.req.valid("query").check }),
    )
    .get("/api/ready", async (c) => {
      let databaseReady = false;

      try {
        if (!checkDatabase) throw new Error("Database not configured");

        await checkDatabase();
        databaseReady = true;
        await checkMessaging?.();

        return c.json(
          { status: "ok", database: "ok", ...(checkMessaging ? { messaging: "ok" } : {}) },
          200,
        );
      } catch {
        return c.json(
          {
            status: "unavailable",
            database: databaseReady ? "ok" : "unavailable",
            ...(checkMessaging ? { messaging: "unavailable" } : {}),
          },
          503,
        );
      }
    });
}

export type AppType = ReturnType<typeof createApp>;
