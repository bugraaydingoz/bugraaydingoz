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

        if (!robots) return;

        queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
          mergeRobotsSnapshot(current, robots, "sse"),
        );
      },
      "robot.updated": (event: MessageEvent<string>) => {
        const robot = parseRobotUpdate(event.data);

        if (!robot) return;

        queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
          mergeRobotUpdate(current, robot),
        );
      },
    }),
    [queryClient],
  );

  return useEventListener("/api/events", listeners);
}
