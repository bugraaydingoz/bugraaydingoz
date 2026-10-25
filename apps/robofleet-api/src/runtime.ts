import type { Database } from "./maps/repository";
import { createEventHub } from "./events/hub";
import { startSimulator } from "./simulator/simulator";
import { createTelemetryProducer } from "./telemetry/producer";
import { createTelemetryRepository } from "./telemetry/repository";
import { startTelemetryWorker } from "./telemetry/worker";
import { startRetention } from "./telemetry/retention";

export async function startRuntime(
  database: Database,
  simulate = true,
  options = { namespace: "robofleet" },
) {
  const hub = createEventHub(),
    producer = createTelemetryProducer(options),
    worker = startTelemetryWorker(database, hub, options);

  try {
    await producer.check();
    await worker.waitUntilReady();

    const stopRetention = startRetention(createTelemetryRepository(database));
    let simulator: Awaited<ReturnType<typeof startSimulator>> | undefined;

    try {
      simulator = simulate ? await startSimulator(database, producer) : undefined;
    } catch (error) {
      await stopRetention();
      throw error;
    }

    let stopping = false;

    return {
      hub,
      async check() {
        if (stopping || !worker.isRunning()) throw new Error("Worker unavailable");

        await producer.check();
      },
      async close() {
        stopping = true;
        hub.close();
        await simulator?.stop();
        await worker.close();
        await stopRetention();
        await producer.close();
      },
    };
  } catch (error) {
    hub.close();
    await worker.close(true);
    await producer.close();
    throw error;
  }
}
