# Messaging

`@repo/messaging` provides typed BullMQ queues and workers backed by shared Redis. Jobs go to one worker; this package does not implement event fan-out.

Add `"@repo/messaging": "workspace:*"` to a backend app's dependencies and run `pnpm install`. Build the package before running the app:

```sh
pnpm --filter @repo/messaging build
```

Set `REDIS_URL` in the app's environment. Use `redis` as the hostname inside Compose and `127.0.0.1` for host-based development:

```sh
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379/0
```

Use the same namespace in the producer and worker, and the app name as the namespace. Keys start with the app name (for example, `my-app:emails:…`), without a library or environment prefix. Prefixes prevent collisions; they do not provide access control.

```ts
import { createQueue, createWorker } from "@repo/messaging";

type EmailJob = { userId: string };
const options = { namespace: "my-app" };

// In the API:
const emails = createQueue<EmailJob>("emails", options);
await emails.waitUntilReady();
await emails.add("welcome", { userId: "123" });

// In the app's worker process:
const worker = createWorker<EmailJob>(
  "emails",
  async (job) => {
    // Load the user and send the email here.
    console.log("Processing", job.name, job.data.userId);
  },
  options,
);

worker.on("failed", (job, error) => {
  console.error("Job failed", job?.id, error.message);
});

// During startup, register cleanup for active jobs and open connections.
const shutdown = async () => {
  await worker.close();
  await emails.close();
};
process.once("SIGTERM", () => {
  void shutdown();
});
process.once("SIGINT", () => {
  void shutdown();
});
```

Defaults: concurrency `1`, three attempts with exponential backoff, up to 100 completed jobs retained for an hour and 1,000 failed jobs retained for a week. Cleanup runs as jobs finish, not on a timer. Override `defaultJobOptions` on a queue or `concurrency` on a worker when needed. `onError` overrides connection-error logging; job failures use the worker's `failed` event.

Await `queue.waitUntilReady()` at app startup while Redis is healthy. After initialization, producers fail promptly during outages; workers reconnect. Initial queue creation waits for Redis to become available. Handlers must tolerate repeated execution: retries and interrupted workers can process a job more than once. Keep payloads small and use database IDs instead of large objects. When deploying a worker, give its container enough `stop_grace_period` to finish active jobs and handle `SIGTERM` by awaiting `worker.close()`.

Apps own job definitions and worker entrypoints. No application jobs or production worker containers are started by this package. Consuming Dockerfiles must copy this package's manifest before install, build it, and copy its `dist` into the runtime image.

## Checks

```sh
pnpm --filter @repo/messaging lint
pnpm --filter @repo/messaging check
pnpm --filter @repo/messaging test
pnpm test:messaging # Starts local Redis and runs integration tests.
```

Integration tests read the root `.env.local` (`REDIS_PASSWORD` and optional `REDIS_PORT`), or an explicit `REDIS_URL`. They use unique namespaces and clean up only their own queues.

Reference: [BullMQ production guidance](https://docs.bullmq.io/guide/going-to-production).
