import { z } from "zod";
import { telemetrySchema } from "../../../../../robofleet-api/src/contracts";
import type { FleetRobot } from "./robots.api";

const fleetRobotSchema = telemetrySchema.extend({
  name: z.string(),
  color: z.string(),
  status: telemetrySchema.shape.status.or(z.literal("Offline")),
  receivedAt: z.string().datetime().nullable(),
  lastSeenAt: z.string().datetime().nullable(),
  sampleAgeMs: z.number().finite().nonnegative().nullable(),
});

const snapshotSchema = z.object({ robots: z.array(fleetRobotSchema) });
const updateSchema = z.object({ robot: fleetRobotSchema });

function parseEvent<T extends z.ZodTypeAny>(data: string, schema: T): z.output<T> | null {
  try {
    const result = schema.safeParse(JSON.parse(data));

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function parseFleetSnapshot(data: string): FleetRobot[] | null {
  return parseEvent(data, snapshotSchema)?.robots ?? null;
}

export function parseRobotUpdate(data: string): FleetRobot | null {
  return parseEvent(data, updateSchema)?.robot ?? null;
}
