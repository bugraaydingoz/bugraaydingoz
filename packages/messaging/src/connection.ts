import type { RedisOptions } from "bullmq";

export function redisConnection(
  value = process.env.REDIS_URL,
  role: "producer" | "worker" = "producer",
): RedisOptions {
  if (!value) throw new Error("REDIS_URL is required for messaging");

  let url: URL;
  try {
    url = new URL(value);
    if (
      !["redis:", "rediss:"].includes(url.protocol) ||
      !url.hostname ||
      !/^(?:\/\d*)?$/.test(url.pathname) ||
      url.search ||
      url.hash
    ) {
      throw new Error("Invalid URL");
    }
    const db = Number(url.pathname.slice(1) || 0);
    if (!Number.isSafeInteger(db)) throw new Error("Invalid database");

    return {
      host: url.hostname.replace(/^\[|\]$/g, ""),
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      db,
      ...(url.protocol === "rediss:" ? { tls: {} } : {}),
      connectTimeout: 5_000,
      maxRetriesPerRequest: role === "worker" ? null : 1,
      enableOfflineQueue: role === "worker",
      ...(role === "producer" ? { commandTimeout: 5_000 } : {}),
    };
  } catch {
    // Do not include the URL: it may contain credentials.
    throw new Error(
      "REDIS_URL must be a redis:// or rediss:// URL with a host and optional database number",
    );
  }
}

export function queuePrefix(namespace: string) {
  if (!/^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/.test(namespace)) {
    throw new Error("Messaging namespace must contain app/environment names separated by colons");
  }
  return `bull:${namespace}`;
}
