import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getRobots, type FleetRobot } from "./robots.api";
import { mergeRobotsSnapshot } from "./robots.cache";
import { presentRobots } from "../utils/present-robot";

export const robotsQueryKey = ["robots"] as const;

export function robotsQueryOptions(queryClient: QueryClient) {
  return queryOptions({
    queryKey: robotsQueryKey,
    queryFn: async () => {
      const incoming = await getRobots();
      const cached = queryClient.getQueryData<FleetRobot[]>(robotsQueryKey);

      return mergeRobotsSnapshot(cached, incoming, "rest");
    },
    select: presentRobots,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
