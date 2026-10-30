import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import fixture from "@/test/fleet.json";
import type { FleetRobot } from "./robots.api";
import { robotsQueryKey, robotsQueryOptions } from "./robots.queries";

describe("robot query presentation", () => {
  it("formats observer data while retaining raw API values in the cache", () => {
    const client = new QueryClient();
    const robot: FleetRobot = {
      ...(fixture.robots[0] as FleetRobot),
      battery: 83.6,
      sampleAgeMs: null,
      task: {
        id: "task",
        title: "Deliver towels",
        progress: 63.7,
        remainingDistance: 12.6,
        etaSeconds: 61,
      },
    };

    client.setQueryData(robotsQueryKey, [robot]);

    const observer = new QueryObserver(client, {
      ...robotsQueryOptions(client),
      enabled: false,
    });
    const unsubscribe = observer.subscribe(() => {});

    try {
      expect(observer.getCurrentResult().data?.[0]).toMatchObject({
        id: robot.robotId,
        battery: 84,
        sampleAgeMs: 0,
        task: { progress: 64, distance: "13 m", eta: "2 min" },
      });
      expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0]).toEqual(robot);

      client.setQueryData(robotsQueryKey, [{ ...robot, battery: 70.4, task: null }]);

      expect(observer.getCurrentResult().data?.[0]).toMatchObject({ battery: 70, task: null });
      expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0].battery).toBe(70.4);
    } finally {
      unsubscribe();
      client.clear();
    }
  });
});
