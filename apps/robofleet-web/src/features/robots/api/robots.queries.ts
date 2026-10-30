import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getRobots, type FleetRobot } from "./robots.api";

export const robotsQueryKey = ["robots"] as const;

export function robotsQueryOptions(queryClient: QueryClient) {
  return queryOptions({
    queryKey: robotsQueryKey,
    queryFn: async () => {
      const incoming = await getRobots();
      const cached = queryClient.getQueryData<FleetRobot[]>(robotsQueryKey);

      return incoming.map((robot) => {
        const prior = cached?.find((r) => r.robotId === robot.robotId);

        return prior &&
          (prior.generation > robot.generation ||
            (prior.generation === robot.generation && prior.sequence >= robot.sequence))
          ? prior
          : robot;
      });
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
