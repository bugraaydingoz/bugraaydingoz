import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Example table: robots
// Adjust this to your actual schema needs.
export const robots = pgTable("robots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
