import { useQuery } from "@tanstack/react-query";
import { mapsQueryOptions } from "../api/maps.queries";

export function useMaps() {
  return useQuery(mapsQueryOptions());
}
