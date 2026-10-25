import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { createQueue, createWorker } from "../index.js";

// This suite only deletes queues under its own randomly generated namespaces.
const url = new URL(process.env.REDIS_URL ?? `redis://127.0.0.1:${process.env.REDIS_PORT ?? 6379}`);
if (!process.env.REDIS_URL && process.env.REDIS_PASSWORD) url.password = process.env.REDIS_PASSWORD;
const redisUrl = url.toString();

test(
  "retains jobs across producer restarts and retries a failed job",
  { timeout: 15_000 },
  async () => {
    const options = { namespace: `messaging:test-${randomUUID()}`, redisUrl };
    const first = createQueue<{ message: string }, string>("jobs", options);
    await first.waitUntilReady();
    const job = await first.add(
      "example",
      { message: "hello" },
      { backoff: { type: "fixed", delay: 20 } },
    );
    await first.close();
    const queue = createQueue<{ message: string }, string>("jobs", options);
    const worker = createWorker<{ message: string }, string>(
      "jobs",
      async (job) => {
        if (job.attemptsMade === 0) throw new Error("Temporary failure");
        return job.data.message.toUpperCase();
      },
      options,
    );
    try {
      const [completed, result] = await once(worker, "completed", {
        signal: AbortSignal.timeout(10_000),
      });
      assert.equal(completed.id, job.id);
      assert.equal(result, "HELLO");
      assert.equal(completed.attemptsMade, 2);
      assert.equal(await queue.getJobCountByTypes("completed"), 1);
    } finally {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  },
);

test(
  "isolates namespaces and processes one job at a time with bounded history",
  { timeout: 15_000 },
  async () => {
    const options = { namespace: `messaging:test-${randomUUID()}`, redisUrl };
    const queue = createQueue("jobs", {
      ...options,
      defaultJobOptions: { removeOnComplete: { count: 1 } },
    });
    const other = createQueue("jobs", { ...options, namespace: `${options.namespace}:other` });
    let active = 0;
    let maxActive = 0;
    let completed = 0;
    let worker: ReturnType<typeof createWorker> | undefined;
    try {
      await Promise.all([queue.waitUntilReady(), other.waitUntilReady()]);
      await other.add("untouched", {});
      await queue.add("first", {});
      await queue.add("second", {});
      worker = createWorker<unknown, unknown>(
        "jobs",
        async () => {
          maxActive = Math.max(maxActive, ++active);
          await setTimeout(20);
          active--;
        },
        options,
      );
      worker.on("completed", () => {
        completed++;
      });
      const deadline = Date.now() + 10_000;
      while (completed < 2 && Date.now() < deadline) await setTimeout(20);
      assert.equal(completed, 2);
      assert.equal(maxActive, 1);
      assert.equal(await queue.getJobCountByTypes("completed"), 1);
      assert.equal(await other.getJobCountByTypes("wait"), 1);
    } finally {
      await worker?.close();
      await Promise.all([queue.obliterate({ force: true }), other.obliterate({ force: true })]);
      await Promise.all([queue.close(), other.close()]);
    }
  },
);
