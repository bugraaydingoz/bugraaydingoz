import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventListener } from "@/shared/hooks/use-event-listener";
import type { FleetRobot } from "../api/robots.api";
import { mergeRobotsSnapshot, mergeRobotUpdate } from "../api/robots.cache";
import { parseFleetSnapshot, parseRobotUpdate } from "../api/robots.events";
import { robotsQueryKey } from "../api/robots.queries";

export function useRobotEvents() {
  const queryClient = useQueryClient();
  const listeners = useMemo(
    () => ({
      "fleet.snapshot": (event: MessageEvent<string>) => {
        const robots = parseFleetSnapshot(event.data);

        if (!robots) return false;

        queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
          mergeRobotsSnapshot(current, robots, "sse"),
        );

        return true;
      },
      "robot.updated": (event: MessageEvent<string>) => {
        const robot = parseRobotUpdate(event.data);

        if (!robot) return false;

        const current = queryClient.getQueryData<FleetRobot[]>(robotsQueryKey);
        const next = mergeRobotUpdate(current, robot);

        if (next === current) return false;

        queryClient.setQueryData(robotsQueryKey, next);

        return true;
      },
    }),
    [queryClient],
  );

  return useEventListener("/api/events", listeners, {
    readyEvent: "fleet.snapshot",
    // The backend sends a snapshot every five seconds, including for an empty fleet.
    staleAfterMs: 15_000,
  });
}
