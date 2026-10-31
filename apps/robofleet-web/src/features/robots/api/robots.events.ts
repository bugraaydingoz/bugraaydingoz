import type { z } from "zod";
import {
  robotsResponseSchema,
  robotUpdateSchema,
} from "../../../../../robofleet-api/src/contracts";
import type { FleetRobot } from "./robots.api";

function parseEvent<T extends z.ZodTypeAny>(data: string, schema: T): z.output<T> | null {
  try {
    const result = schema.safeParse(JSON.parse(data));

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function parseFleetSnapshot(data: string): FleetRobot[] | null {
  return parseEvent(data, robotsResponseSchema)?.robots ?? null;
}

export function parseRobotUpdate(data: string): FleetRobot | null {
  return parseEvent(data, robotUpdateSchema)?.robot ?? null;
}
