import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/test/fleet.json";
import { TestEventSource } from "@/test/event-source";
import type { FleetRobot } from "../api/robots.api";
import { robotsQueryKey } from "../api/robots.queries";
import { useRobotEvents } from "./use-robot-events";

beforeEach(() => {
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const hook = renderHook(useRobotEvents, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });

  return { client, ...hook, source: TestEventSource.instances[0] };
}

describe("useRobotEvents", () => {
  it("requires a valid full snapshot before reporting a live fleet", () => {
    const { source, result } = setup();

    act(() => {
      source.emit("open");
      source.emit("fleet.snapshot", { robots: null });
      source.emit("robot.updated", { robot: fixture.robots[0] });
    });

    expect(result.current).toBe("connecting");

    act(() => source.emit("fleet.snapshot", { robots: [] }));

    expect(result.current).toBe("live");
  });

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

  it("retains cached telemetry but expires freshness despite malformed and older updates", () => {
    const { client, source, result } = setup();
    const robot = { ...fixture.robots[0], sequence: 10 };

    act(() => source.emit("fleet.snapshot", { robots: [robot] }));
    const cached = client.getQueryData(robotsQueryKey);
    act(() => {
      vi.advanceTimersByTime(10_000);
      source.emit("fleet.snapshot", { robots: null });
      source.emit("robot.updated", { robot: { ...robot, sequence: 9, battery: 1 } });
      source.emit("robot.updated", { robot: { ...robot, generation: robot.generation - 1 } });
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe("stale");
    expect(client.getQueryData(robotsQueryKey)).toBe(cached);
    expect(source.close).toHaveBeenCalledOnce();

    act(() => vi.advanceTimersByTime(2000));
    const second = TestEventSource.instances[1];
    act(() => second.emit("open"));

    expect(result.current).toBe("stale");

    act(() => second.emit("fleet.snapshot", { robots: [robot] }));

    expect(result.current).toBe("live");
  });

  it.each(["snapshot", "update"])("accepts a same-sequence offline %s as fresh", (event) => {
    const { source, result, client } = setup();
    const robot = fixture.robots[0];
    const offline = { ...robot, status: "Offline", sampleAgeMs: 15_000 };

    act(() => {
      source.emit("fleet.snapshot", { robots: [robot] });
      vi.advanceTimersByTime(10_000);
      source.emit(
        event === "snapshot" ? "fleet.snapshot" : "robot.updated",
        event === "snapshot" ? { robots: [offline] } : { robot: offline },
      );
      vi.advanceTimersByTime(14_999);
    });

    expect(result.current).toBe("live");
    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0].status).toBe("Offline");

    act(() => vi.advanceTimersByTime(1));

    expect(result.current).toBe("stale");
  });

  it("keeps an empty fleet live while valid empty snapshots continue", () => {
    const { source, result } = setup();

    act(() => {
      source.emit("fleet.snapshot", { robots: [] });
      vi.advanceTimersByTime(10_000);
      source.emit("fleet.snapshot", { robots: [] });
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current).toBe("live");
    expect(TestEventSource.instances).toHaveLength(1);
  });
});
