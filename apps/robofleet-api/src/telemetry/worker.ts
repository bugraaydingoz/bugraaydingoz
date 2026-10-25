import { redisUrl } from "../config";
import type { MessagingOptions } from "@repo/messaging";
import { createWorker, UnrecoverableError } from "@repo/messaging";
import { telemetrySchema, type Telemetry } from "../contracts";
import type { EventHub } from "../events/hub";
import type { Database } from "../maps/repository";
import { createRobotRepository } from "../robots/repository";
import { createTelemetryRepository, InvalidTelemetry } from "./repository";

export function startTelemetryWorker(
  database: Database,
  hub: EventHub,
  options: MessagingOptions = { namespace: "robofleet" },
) {
  const telemetry = createTelemetryRepository(database),
    robots = createRobotRepository(database);
  const worker = createWorker<Telemetry>(
    "telemetry",
    async (job) => {
      const parsed = telemetrySchema.safeParse(job.data);

      if (!parsed.success) {
        throw new UnrecoverableError("Invalid telemetry message");
      }

      try {
        await telemetry.accept(parsed.data, new Date(job.timestamp));

        // Also notify on a retry after a committed write; clients ignore old versions.
        const robot = await robots.get(parsed.data.robotId);

        if (robot) hub.publish(robot);
      } catch (error) {
        if (error instanceof InvalidTelemetry) throw new UnrecoverableError(error.message);

        throw error;
      }
    },
    { ...options, redisUrl: options.redisUrl ?? redisUrl() },
  );

  worker.on("failed", (job) => console.error("Telemetry job failed", job?.id));

  return worker;
}
