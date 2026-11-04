import { useQueryClient } from "@tanstack/react-query";
import { useServerEvents } from "@/shared/hooks/use-server-events";
import type { FleetRobot } from "../api/robots.api";
import { mergeRobotsSnapshot, mergeRobotUpdate } from "../api/robots.cache";
import { parseFleetSnapshot, parseRobotUpdate } from "../api/robots.events";
import { robotsQueryKey } from "../api/robots.queries";

export function useRobotEvents() {
  const queryClient = useQueryClient();
  const listeners = {
    "fleet.snapshot": (event: MessageEvent<string>) => {
      const robots = parseFleetSnapshot(event.data);

      if (!robots) return;

      queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
        mergeRobotsSnapshot(current, robots, "sse"),
      );
    },
    "robot.updated": (event: MessageEvent<string>) => {
      const robot = parseRobotUpdate(event.data);

      if (!robot) return;

      const current = queryClient.getQueryData<FleetRobot[]>(robotsQueryKey);
      const next = mergeRobotUpdate(current, robot);

      if (next === current) return;

      queryClient.setQueryData(robotsQueryKey, next);
    },
  };

  return useServerEvents("/api/events", listeners);
}
