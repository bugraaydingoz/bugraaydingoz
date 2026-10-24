import { hc } from "hono/client";
import type { AppType } from "../../../robofleet-api/src/app";

const client = hc<AppType>("/");

export async function getHealth() {
  const response = await client.api.health.$get({ query: {} });
  if (!response.ok) {
    throw new Error("Unable to reach the API");
  }
  return response.json();
}
