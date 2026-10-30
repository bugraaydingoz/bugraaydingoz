import { queryOptions } from "@tanstack/react-query";
import { getMaps } from "./maps.api";

export const mapsQueryKey = ["maps"] as const;

export function mapsQueryOptions() {
  return queryOptions({
    queryKey: mapsQueryKey,
    queryFn: getMaps,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
  });
}
