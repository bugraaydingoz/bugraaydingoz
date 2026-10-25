/** Separate password env supports Compose secrets containing URL-reserved characters. */
export function redisUrl() {
  if (!process.env.REDIS_URL) return undefined;

  try {
    const url = new URL(process.env.REDIS_URL);

    if (process.env.REDIS_PASSWORD) url.password = process.env.REDIS_PASSWORD;

    return url.toString();
  } catch {
    throw new Error("Invalid Redis configuration");
  }
}
