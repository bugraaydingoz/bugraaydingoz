import { useQuery, useQueryClient } from "@tanstack/react-query";
import { robotsQueryOptions } from "../api/robots.queries";

export function useRobots() {
  const queryClient = useQueryClient();

  return useQuery(robotsQueryOptions(queryClient));
}
