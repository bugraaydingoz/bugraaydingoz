import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/test/fleet.json";
import { TestEventSource } from "@/test/event-source";
import type { FleetRobot } from "../api/robots.api";
import { robotsQueryKey } from "../api/robots.queries";
import { useRobotEvents } from "./use-robot-events";

beforeEach(() => {
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
});

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const hook = renderHook(useRobotEvents, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });

  return { client, ...hook, source: TestEventSource.instances[0] };
}

describe("useRobotEvents", () => {
  it("applies snapshots and updates to the raw query cache without reconnecting on rerender", () => {
    const { client, source, rerender, unmount } = setup();
    const robot = fixture.robots[0] as FleetRobot;
    const updated = { ...robot, sequence: 2, battery: 83.6 };

    act(() => {
      source.emit("open");
      source.emit("fleet.snapshot", { robots: fixture.robots });
      source.emit("robot.updated", { robot: updated });
      source.emit("robot.updated", { robot: { ...robot, battery: 1 } });
    });
    rerender();

    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)).toHaveLength(8);
    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0]).toEqual(updated);
    expect(TestEventSource.instances).toHaveLength(1);

    unmount();
    source.emit("robot.updated", { robot: { ...updated, sequence: 3, battery: 1 } });

    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0]).toEqual(updated);
  });

  it("accepts same-sequence offline refreshes and empty snapshots", () => {
    const { client, source } = setup();
    const robot = fixture.robots[0] as FleetRobot;
    const offline = { ...robot, status: "Offline", sampleAgeMs: 15_000 };

    act(() => {
      source.emit("robot.updated", { robot });
      source.emit("fleet.snapshot", { robots: [offline] });
    });

    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)).toEqual([offline]);

    act(() => source.emit("fleet.snapshot", { robots: [] }));

    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)).toEqual([]);
  });

  it("ignores invalid JSON and invalid payloads without changing cached data or the connection", () => {
    const { client, source, result } = setup();
    const robot = fixture.robots[0] as FleetRobot;

    act(() => {
      source.emit("open");
      source.emit("fleet.snapshot", { robots: [robot] });
    });
    const cached = client.getQueryData(robotsQueryKey);

    act(() => {
      source.dispatchEvent(new MessageEvent("fleet.snapshot", { data: "{" }));
      source.dispatchEvent(new MessageEvent("robot.updated", { data: "not json" }));
      source.emit("fleet.snapshot", { robots: [robot, { robotId: "invalid" }] });
      source.emit("fleet.snapshot", { robots: null });
      source.emit("robot.updated", { robot: { ...robot, sequence: 2, position: { x: "bad" } } });
      source.emit("robot.updated", { robot: { ...robot, sequence: 2, battery: 101 } });
      source.emit("robot.updated", { unexpected: robot });
    });

    expect(client.getQueryData(robotsQueryKey)).toBe(cached);
    expect(result.current).toBe("live");

    act(() => source.emit("robot.updated", { robot: { ...robot, sequence: 2, battery: 70 } }));

    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0].battery).toBe(70);
    expect(TestEventSource.instances).toHaveLength(1);
  });
});
