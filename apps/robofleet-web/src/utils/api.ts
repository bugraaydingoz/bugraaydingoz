import { hc } from "hono/client";
import type { AppType } from "../../../robofleet-api/src/app";
import type { FleetMap, FleetRobot } from "../../../robofleet-api/src/contracts";

const client = hc<AppType>("/");

export type { FleetMap, FleetRobot };

export async function getHealth() {
  const response = await client.api.health.$get({ query: {} });

  if (!response.ok) throw new Error("Unable to reach the API");

  return response.json();
}

export async function getRobots(): Promise<FleetRobot[]> {
  const response = await client.api.robots.$get();

  if (!response.ok) throw new Error("Unable to load fleet");

  return (await response.json()).robots;
}

export async function getMaps(): Promise<FleetMap[]> {
  const response = await client.api.maps.$get();

  if (!response.ok) throw new Error("Unable to load maps");

  return (await response.json()).maps;
}
