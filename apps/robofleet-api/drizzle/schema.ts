import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  index,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { MapDefinition, RobotProfile, Telemetry } from "../src/contracts";

export const maps = pgTable("maps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  activeVersion: integer("active_version").notNull(),
});

export const mapVersions = pgTable(
  "map_versions",
  {
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id),
    version: integer("version").notNull(),
    definition: jsonb("definition").$type<MapDefinition>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.mapId, t.version] }) }),
);

export const robots = pgTable("robots", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  profile: jsonb("profile").$type<RobotProfile>(),
  generation: integer("generation").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const robotState = pgTable("robot_state", {
  robotId: text("robot_id")
    .primaryKey()
    .references(() => robots.id, { onDelete: "cascade" }),
  generation: integer("generation").notNull(),
  sequence: integer("sequence").notNull(),
  payload: jsonb("payload").$type<Telemetry>().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
});

export const robotTelemetry = pgTable(
  "robot_telemetry",
  {
    eventId: uuid("event_id").primaryKey(),
    robotId: text("robot_id")
      .notNull()
      .references(() => robots.id, { onDelete: "cascade" }),
    generation: integer("generation").notNull(),
    sequence: integer("sequence").notNull(),
    payload: jsonb("payload").$type<Telemetry>().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    retention: index("telemetry_received_at_idx").on(t.receivedAt),
    history: index("telemetry_robot_history_idx").on(t.robotId, t.receivedAt, t.eventId),
    ordering: uniqueIndex("telemetry_robot_sequence_idx").on(t.robotId, t.generation, t.sequence),
  }),
);
