import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMaps, getRobots, type FleetRobot, type FleetMap } from "@/utils/api";
import type { Robot } from "@/data/robots";

export function presentRobot(robot: FleetRobot): Robot {
  return {
    ...robot,
    id: robot.robotId,
    battery: Math.round(robot.battery),
    speedMps: robot.speedMps ?? 0,
    sampleAgeMs: robot.sampleAgeMs ?? 0,
    task: robot.task
      ? {
          ...robot.task,
          progress: Math.round(robot.task.progress),
          distance: `${Math.round(robot.task.remainingDistance)} m`,
          eta:
            robot.task.etaSeconds === null
              ? "Paused"
              : `${Math.max(1, Math.ceil(robot.task.etaSeconds / 60))} min`,
        }
      : null,
  };
}

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
  const fleet = useQuery({
    queryKey: ["robots"],
    queryFn: async () => {
      const incoming = await getRobots();
      const cached = queryClient.getQueryData<FleetRobot[]>(["robots"]);

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
  const maps = useQuery({
    queryKey: ["maps"],
    queryFn: getMaps,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
  });
  const [connection, setConnection] = useState<FleetData["connection"]>("connecting");

  useEffect(() => {
    let source: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const connect = () => {
      if (stopped) return;

      source = new EventSource("/api/events");

      const newer = (incoming: FleetRobot, current: FleetRobot) =>
        incoming.generation > current.generation ||
        (incoming.generation === current.generation && incoming.sequence >= current.sequence);

      source.addEventListener("fleet.snapshot", (event) => {
        try {
          const incoming = (JSON.parse(event.data) as { robots: FleetRobot[] }).robots;

          queryClient.setQueryData<FleetRobot[]>(["robots"], (current) =>
            incoming.map((robot) => {
              const prior = current?.find((r) => r.robotId === robot.robotId);

              return prior && !newer(robot, prior) ? prior : robot;
            }),
          );
          setConnection("live");
        } catch {
          setConnection("reconnecting");
        }
      });
      source.addEventListener("robot.updated", (event) => {
        try {
          const { robot } = JSON.parse(event.data) as { robot: FleetRobot };

          queryClient.setQueryData<FleetRobot[]>(["robots"], (current) => {
            if (!current) return [robot];

            const prior = current.find((r) => r.robotId === robot.robotId);

            if (prior && !newer(robot, prior)) return current;

            return prior
              ? current.map((r) => (r.robotId === robot.robotId ? robot : r))
              : [...current, robot];
          });
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
        robots: (fleet.data ?? []).map(presentRobot),
        maps: maps.data ?? [],
        connection: effective,
      }}
    >
      {children}
    </FleetDataContext.Provider>
  );
}
