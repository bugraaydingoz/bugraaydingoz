import { client } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse-response";
import { mapsResponseSchema, type FleetMap } from "../../../../../robofleet-api/src/contracts";

export type { FleetMap };

export async function getMaps(): Promise<FleetMap[]> {
  const response = await client.api.maps.$get();

  if (!response.ok) throw new Error("Unable to load maps");

  return (await parseResponse(response, mapsResponseSchema, "Invalid maps response")).maps;
}
