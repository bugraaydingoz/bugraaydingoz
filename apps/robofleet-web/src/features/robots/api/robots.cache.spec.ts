import { describe, expect, it } from "vitest";
import fixture from "@/test/fleet.json";
import type { FleetRobot } from "./robots.api";
import { mergeRobotsSnapshot, mergeRobotUpdate } from "./robots.cache";

function robot(overrides: Partial<FleetRobot> = {}): FleetRobot {
  return { ...(fixture.robots[0] as FleetRobot), generation: 2, sequence: 10, ...overrides };
}

describe.each(["rest", "sse"] as const)("%s snapshot merging", (source) => {
  it.each([
    { generation: 1, sequence: 100, accept: false },
    { generation: 2, sequence: 9, accept: false },
    { generation: 2, sequence: 11, accept: true },
    { generation: 3, sequence: 0, accept: true },
  ])("orders generation $generation and sequence $sequence", ({ generation, sequence, accept }) => {
    const current = robot();
    const incoming = robot({ generation, sequence });

    expect(mergeRobotsSnapshot([current], [incoming], source)[0]).toBe(accept ? incoming : current);
  });

  it("uses snapshot membership and order without mutating the cached list", () => {
    const current = [robot(), robot({ robotId: "removed" })];
    const incoming = [robot({ robotId: "added" }), robot({ sequence: 9 })];

    expect(mergeRobotsSnapshot(current, incoming, source)).toEqual([incoming[0], current[0]]);
    expect(current.map((entry) => entry.robotId)).toEqual([robot().robotId, "removed"]);
    expect(mergeRobotsSnapshot(current, [], source)).toEqual([]);
    expect(mergeRobotsSnapshot(undefined, incoming, source)).toEqual(incoming);
  });
});

describe("equal-sequence snapshots", () => {
  it("keeps cached data for REST but accepts SSE age and offline status refreshes", () => {
    const current = robot({ sampleAgeMs: 0 });
    const incoming = robot({ status: "Offline", sampleAgeMs: 15_000 });

    expect(mergeRobotsSnapshot([current], [incoming], "rest")[0]).toBe(current);
    expect(mergeRobotsSnapshot([current], [incoming], "sse")[0]).toBe(incoming);
  });
});

describe("robot update merging", () => {
  it.each([
    { generation: 1, sequence: 100 },
    { generation: 2, sequence: 9 },
  ])("ignores stale generation $generation and sequence $sequence", (version) => {
    const current = [robot()];

    expect(mergeRobotUpdate(current, robot(version))).toBe(current);
  });

  it.each([
    { generation: 2, sequence: 10 },
    { generation: 2, sequence: 11 },
    { generation: 3, sequence: 0 },
  ])("accepts generation $generation and sequence $sequence", (version) => {
    const current = [robot(), robot({ robotId: "other" })];
    const incoming = robot({ ...version, status: "Offline", sampleAgeMs: 15_000 });

    const merged = mergeRobotUpdate(current, incoming);

    expect(merged[0]).toBe(incoming);
    expect(merged[1]).toBe(current[1]);
    expect(current[0].status).toBe("Working");
  });

  it("initializes an empty cache and appends previously unseen robots", () => {
    const current = [robot()];
    const incoming = robot({ robotId: "new" });

    expect(mergeRobotUpdate(undefined, incoming)).toEqual([incoming]);
    expect(mergeRobotUpdate([], incoming)).toEqual([incoming]);
    expect(mergeRobotUpdate(current, incoming)).toEqual([current[0], incoming]);
    expect(current).toHaveLength(1);
  });
});
