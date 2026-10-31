import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { robotsQueryOptions } from "@/features/robots/api/robots.queries";
import { mapsQueryOptions } from "../api/maps.queries";

export function useMapRecovery() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Force fresh, validated responses even when cached map data is still within staleTime.
    // fetchQuery rejects on failure and retains the last good cache for the fleet panel.
    await Promise.all([
      queryClient.fetchQuery({ ...robotsQueryOptions(queryClient), staleTime: 0, retry: false }),
      queryClient.fetchQuery({ ...mapsQueryOptions(), staleTime: 0, retry: false }),
    ]);
  }, [queryClient]);
}
