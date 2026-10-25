import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { FleetRobot } from "../contracts";
import type { EventHub } from "./hub";

export function eventRoutes(hub: EventHub | undefined, list: () => Promise<FleetRobot[]>) {
  return new Hono().get("/events", (c) => {
    if (!hub || hub.closed) return c.json({ error: "Fleet is shutting down" }, 503);

    c.header("Cache-Control", "no-cache, no-transform");

    return streamSSE(c, async (stream) => {
      // Coalesce by robot so a slow browser cannot create an unbounded queue.
      const pending = new Map<string, FleetRobot>();
      let wake = () => {};
      const unsubscribe = hub.subscribe((robot) => {
        if (robot) pending.set(robot.robotId, robot);

        wake();
      });

      stream.onAbort(() => {
        unsubscribe();
        wake();
      });

      let snapshotAt = 0;

      try {
        while (!stream.aborted && !hub.closed) {
          if (Date.now() - snapshotAt >= 5000) {
            // Subscribe first, then read. Versioned updates received during this read
            // remain buffered and the client discards any older than the snapshot.
            const robots = await list();

            await stream.writeSSE({ event: "fleet.snapshot", data: JSON.stringify({ robots }) });
            snapshotAt = Date.now();
          }

          const batch = [...pending.values()];

          pending.clear();

          for (const robot of batch) {
            await stream.writeSSE({ event: "robot.updated", data: JSON.stringify({ robot }) });
          }

          if (stream.aborted || hub.closed) break;

          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 1000);

            wake = () => {
              clearTimeout(timer);
              resolve();
            };

            if (pending.size || stream.aborted || hub.closed) wake();
          });
        }
      } finally {
        unsubscribe();
      }
    });
  });
}
