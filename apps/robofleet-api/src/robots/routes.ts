import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { createRobotRepository } from "./repository";

const cursorSchema = z.object({ at: z.string().datetime(), id: z.string().uuid() });

const historyQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().max(500).optional(),
});

export function robotRoutes(repository: ReturnType<typeof createRobotRepository>) {
  return new Hono()
    .get("/robots", async (c) => c.json({ robots: await repository.list() }))
    .get("/robots/:id", async (c) => {
      const robot = await repository.get(c.req.param("id"));

      return robot ? c.json({ robot }) : c.json({ error: "Robot not found" }, 404);
    })
    .get("/robots/:id/telemetry", zValidator("query", historyQuery), async (c) => {
      const { limit, before } = c.req.valid("query");
      let cursor: z.infer<typeof cursorSchema> | undefined;

      if (before) {
        try {
          cursor = cursorSchema.parse(JSON.parse(Buffer.from(before, "base64url").toString()));
        } catch {
          return c.json({ error: "Invalid history cursor" }, 400);
        }
      }

      if (!(await repository.get(c.req.param("id"))))
        return c.json({ error: "Robot not found" }, 404);

      return c.json(await repository.history(c.req.param("id"), limit, cursor));
    });
}
