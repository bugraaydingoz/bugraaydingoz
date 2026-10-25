import { z } from "zod";

export const pointSchema = z.tuple([z.number().finite(), z.number().finite()]);

export const mapDefinitionSchema = z
  .object({
    width: z.number().positive(),
    depth: z.number().positive(),
    metresPerUnit: z.number().positive(),
    viewBox: z.object({ width: z.number().positive(), height: z.number().positive() }),
    projection: z.object({
      x: z.number(),
      y: z.number(),
      scaleX: z.number().positive(),
      scaleY: z.number().positive(),
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

export type FleetMap = { id: string; name: string; version: number; definition: MapDefinition };

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  progress: z.number().min(0).max(100),
  remainingDistance: z.number().nonnegative(),
  etaSeconds: z.number().nonnegative().nullable(),
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

export type FleetRobot = Omit<Telemetry, "status"> & {
  name: string;
  color: string;
  status: Telemetry["status"] | "Offline";
  receivedAt: string | null;
  lastSeenAt: string | null;
  /** Age at response creation; clients can use a monotonic clock without server clock skew. */
  sampleAgeMs: number | null;
};

export const RETENTION_MS = 60 * 60 * 1000;

export const OFFLINE_MS = 10_000;
