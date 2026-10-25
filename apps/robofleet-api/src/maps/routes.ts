import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { createMapRepository } from "./repository";

export function mapRoutes(repository: ReturnType<typeof createMapRepository>) {
  return new Hono()
    .get("/maps", async (c) => c.json({ maps: await repository.list() }))
    .get(
      "/maps/:id",
      zValidator("query", z.object({ version: z.coerce.number().int().positive().optional() })),
      async (c) => {
        const map = await repository.get(c.req.param("id"), c.req.valid("query").version);

        return map ? c.json({ map }) : c.json({ error: "Map not found" }, 404);
      },
    );
}
