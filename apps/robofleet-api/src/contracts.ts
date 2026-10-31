import { z } from "zod";

export const pointSchema = z.tuple([z.number().finite(), z.number().finite()]);

export const mapDefinitionSchema = z
  .object({
    width: z.number().finite().positive(),
    depth: z.number().finite().positive(),
    metresPerUnit: z.number().finite().positive(),
    viewBox: z.object({
      width: z.number().finite().positive(),
      height: z.number().finite().positive(),
    }),
    projection: z.object({
      x: z.number().finite(),
      y: z.number().finite(),
      scaleX: z.number().finite().positive(),
      scaleY: z.number().finite().positive(),
    }),
    asset: z.string(),
    nodes: z.array(pointSchema).min(1),
    edges: z.array(z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])),
    destinations: z.array(
      z.object({
        name: z.string(),
        point: pointSchema,
        node: z.number().int().nonnegative(),
        via: z.array(pointSchema),
      }),
    ),
  })
  .superRefine((map, context) => {
    if (
      map.edges.some(([a, b]) => a >= map.nodes.length || b >= map.nodes.length) ||
      map.destinations.some((d) => d.node >= map.nodes.length)
    ) {
      context.addIssue({ code: "custom", message: "Map references a missing corridor node" });
    }
  });

export type Point = z.infer<typeof pointSchema>;

export type MapDefinition = z.infer<typeof mapDefinitionSchema>;

export const fleetMapSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  version: z.number().int().positive(),
  definition: mapDefinitionSchema,
});

export type FleetMap = z.infer<typeof fleetMapSchema>;

export const mapsResponseSchema = z.object({ maps: z.array(fleetMapSchema) });

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  progress: z.number().min(0).max(100),
  remainingDistance: z.number().finite().nonnegative(),
  etaSeconds: z.number().finite().nonnegative().nullable(),
});

export const telemetrySchema = z
  .object({
    version: z.literal(1),
    eventId: z.string().uuid(),
    robotId: z.string().min(1).max(100),
    generation: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative(),
    recordedAt: z.string().datetime(),
    mapId: z.string(),
    mapVersion: z.number().int().positive(),
    position: z.object({
      x: z.number().finite(),
      y: z.number().finite(),
      heading: z.number().finite(),
    }),
    status: z.enum(["Working", "Charging", "Idle", "Blocked"]),
    battery: z.number().min(0).max(100),
    speedMps: z.number().finite().nonnegative().default(0),
    location: z.string(),
    destination: z.string().nullable(),
    detail: z.string(),
    task: taskSchema.nullable(),
    route: z.array(pointSchema).max(1000),
  })
  .strict();

export type Telemetry = z.infer<typeof telemetrySchema>;

export type RobotProfile = {
  color: string;
  mapId: string;
  mapVersion: number;
  scenario: "working" | "charging" | "idle" | "blocked" | "offline";
  initial: Omit<
    Telemetry,
    "version" | "eventId" | "robotId" | "generation" | "sequence" | "recordedAt" | "speedMps"
  >;
};

export const fleetRobotSchema = telemetrySchema
  .extend({
    name: z.string(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    status: telemetrySchema.shape.status.or(z.literal("Offline")),
    receivedAt: z.string().datetime().nullable(),
    lastSeenAt: z.string().datetime().nullable(),
    /** Age at response creation; clients can use a monotonic clock without server clock skew. */
    sampleAgeMs: z.number().finite().nonnegative().nullable(),
  })
  // Responses may gain fields without breaking older dashboard clients.
  .strip();

export type FleetRobot = z.infer<typeof fleetRobotSchema>;

// REST fleet responses and SSE snapshots carry the same payload.
export const robotsResponseSchema = z.object({ robots: z.array(fleetRobotSchema) });
export const robotUpdateSchema = z.object({ robot: fleetRobotSchema });

export const RETENTION_MS = 60 * 60 * 1000;

export const OFFLINE_MS = 10_000;
