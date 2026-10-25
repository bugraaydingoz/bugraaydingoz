import type { FleetRobot } from "../contracts";

export function createEventHub() {
  const listeners = new Set<(robot: FleetRobot | null) => void>();
  let closed = false;

  return {
    get closed() {
      return closed;
    },
    subscribe(listener: (robot: FleetRobot | null) => void) {
      if (closed) throw new Error("Fleet is shutting down");

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    publish(robot: FleetRobot) {
      for (const listener of listeners) listener(robot);
    },
    close() {
      closed = true;

      for (const listener of listeners) listener(null);

      listeners.clear();
    },
  };
}

export type EventHub = ReturnType<typeof createEventHub>;
