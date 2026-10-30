import { client } from "./client";

export async function getHealth() {
  const response = await client.api.health.$get({ query: {} });

  if (!response.ok) throw new Error("Unable to reach the API");

  return response.json();
}
