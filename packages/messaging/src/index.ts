import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import { queuePrefix, redisConnection } from "./connection.js";

export type { Job, JobsOptions, Processor } from "bullmq";

export type MessagingOptions = {
  /** Use a distinct app/environment pair, e.g. production:robofleet. */
  namespace: string;
  /** Defaults to REDIS_URL. */
  redisUrl?: string;
  onError?: (error: Error) => void;
};

export function createQueue<Data = unknown, Result = unknown, Name extends string = string>(
  name: string,
  options: MessagingOptions & { defaultJobOptions?: JobsOptions },
) {
  const queue = new Queue<Data, Result, Name, Data, Result, Name>(name, {
    prefix: queuePrefix(options.namespace),
    connection: redisConnection(options.redisUrl, "producer"),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: { age: 3_600, count: 100 },
      removeOnFail: { age: 7 * 86_400, count: 1_000 },
      ...options.defaultJobOptions,
    },
  });
  queue.on("error", options.onError ?? logError);
  return queue;
}

export function createWorker<Data = unknown, Result = unknown, Name extends string = string>(
  name: string,
  processor: Processor<Data, Result, Name>,
  options: MessagingOptions & { concurrency?: number },
) {
  const worker = new Worker<Data, Result, Name>(name, processor, {
    prefix: queuePrefix(options.namespace),
    connection: redisConnection(options.redisUrl, "worker"),
    concurrency: options.concurrency ?? 1,
  });
  worker.on("error", options.onError ?? logError);
  return worker;
}

function logError(error: Error) {
  console.error("Messaging connection error:", error.message);
}
