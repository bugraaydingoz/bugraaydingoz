import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { robotsQueryOptions } from "@/features/robots/api/robots.queries";
import { useRobotEvents } from "@/features/robots/hooks/use-robot-events";
import type { FleetMap } from "@/features/maps/api/maps.api";
import { mapsQueryOptions } from "@/features/maps/api/maps.queries";
import type { Robot } from "@/features/robots/types/robot";

export type FleetData = {
  robots: Robot[];
  maps: FleetMap[];
  connection: "connecting" | "live" | "reconnecting" | "unavailable";
};

export const FleetDataContext = createContext<FleetData>({
  robots: [],
  maps: [],
  connection: "connecting",
});

export const useFleetData = () => useContext(FleetDataContext);

export function LiveFleetProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const fleet = useQuery(robotsQueryOptions(queryClient));
  const maps = useQuery(mapsQueryOptions());
  const connection = useRobotEvents();

  const effective = fleet.isError || maps.isError ? "unavailable" : connection;

  return (
    <FleetDataContext.Provider
      value={{
        robots: fleet.data ?? [],
        maps: maps.data ?? [],
        connection: effective,
      }}
    >
      {children}
    </FleetDataContext.Provider>
  );
}
