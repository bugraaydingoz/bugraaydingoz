import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Initialize Hono app
const app = new Hono();

// Example route with Zod validation
app.get(
  '/api/health',
  zValidator(
    'query',
    z.object({
      check: z.string().optional().default('ok'),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Invalid query parameters' }, 400);
      }
      return c.json({ status: result.data.check });
    }
  )
);

// Initialize Drizzle ORM (Postgres)
const queryClient = postgres(process.env.DATABASE_URL!);
const _db = drizzle(queryClient);

// Start server
const port = process.env.PORT || 3000;
console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};