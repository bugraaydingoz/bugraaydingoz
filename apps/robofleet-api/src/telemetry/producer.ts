import { redisUrl } from "../config";
import type { MessagingOptions } from "@repo/messaging";
import { createQueue } from "@repo/messaging";
import { telemetrySchema, type Telemetry } from "../contracts";

export function createTelemetryProducer(options: MessagingOptions = { namespace: "robofleet" }) {
  const queue = createQueue<Telemetry>("telemetry", {
    ...options,
    redisUrl: options.redisUrl ?? redisUrl(),
    defaultJobOptions: { removeOnComplete: true, removeOnFail: { age: 3600, count: 1000 } },
  });

  return {
    queue,
    async publish(value: Telemetry) {
      const message = telemetrySchema.parse(value);

      await queue.add("telemetry.received", message, { jobId: message.eventId });
    },
    async check() {
      await queue.getJobCountByTypes("wait");
    },
    close: () => queue.close(),
  };
}
