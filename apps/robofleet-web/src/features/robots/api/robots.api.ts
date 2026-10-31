import { client } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse-response";
import { robotsResponseSchema, type FleetRobot } from "../../../../../robofleet-api/src/contracts";

export type { FleetRobot };

export async function getRobots(): Promise<FleetRobot[]> {
  const response = await client.api.robots.$get();

  if (!response.ok) throw new Error("Unable to load fleet");

  return (await parseResponse(response, robotsResponseSchema, "Invalid fleet response")).robots;
}
