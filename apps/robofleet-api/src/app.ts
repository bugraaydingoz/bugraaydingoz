import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const healthQuery = z.object({
  check: z.string().default("ok"),
});

export const app = new Hono().get(
  "/api/health",
  zValidator("query", healthQuery, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid query parameters" }, 400);
    }
  }),
  (c) => c.json({ status: c.req.valid("query").check }),
);

export type AppType = typeof app;
