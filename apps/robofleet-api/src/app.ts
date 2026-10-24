import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const healthQuery = z.object({
  check: z.string().default("ok"),
});

export function createApp({ checkDatabase }: { checkDatabase?: () => Promise<unknown> } = {}) {
  return new Hono()
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
      try {
        if (!checkDatabase) throw new Error("Database not configured");
        await checkDatabase();
        return c.json({ status: "ok", database: "ok" }, 200);
      } catch {
        return c.json({ status: "unavailable", database: "unavailable" }, 503);
      }
    });
}

export type AppType = ReturnType<typeof createApp>;
