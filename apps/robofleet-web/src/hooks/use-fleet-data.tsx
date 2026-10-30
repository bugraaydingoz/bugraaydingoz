import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FleetRobot } from "@/features/robots/api/robots.api";
import { robotsQueryKey, robotsQueryOptions } from "@/features/robots/api/robots.queries";
import { mergeRobotsSnapshot, mergeRobotUpdate } from "@/features/robots/api/robots.cache";
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
  const [connection, setConnection] = useState<FleetData["connection"]>("connecting");

  useEffect(() => {
    let source: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      if (stopped) return;

      source = new EventSource("/api/events");

      source.addEventListener("fleet.snapshot", (event) => {
        try {
          const incoming = (JSON.parse(event.data) as { robots: FleetRobot[] }).robots;

          queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
            mergeRobotsSnapshot(current, incoming, "sse"),
          );
          setConnection("live");
        } catch {
          setConnection("reconnecting");
        }
      });
      source.addEventListener("robot.updated", (event) => {
        try {
          const { robot } = JSON.parse(event.data) as { robot: FleetRobot };

          queryClient.setQueryData<FleetRobot[]>(robotsQueryKey, (current) =>
            mergeRobotUpdate(current, robot),
          );
        } catch {
          setConnection("reconnecting");
        }
      });
      source.onerror = () => {
        if (stopped) return;

        source.close();
        setConnection("reconnecting");
        retryTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      source.close();
    };
  }, [queryClient]);

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
