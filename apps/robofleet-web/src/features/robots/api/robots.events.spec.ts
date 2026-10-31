import { describe, expect, it } from "vitest";
import fixture from "@/test/fleet.json";
import { parseFleetSnapshot, parseRobotUpdate } from "./robots.events";

describe("fleet event parsing", () => {
  it("accepts full snapshots, empty snapshots, and valid updates", () => {
    expect(parseFleetSnapshot(JSON.stringify({ robots: fixture.robots }))).toEqual(fixture.robots);
    expect(parseFleetSnapshot('{"robots":[]}')).toEqual([]);
    expect(parseRobotUpdate(JSON.stringify({ robot: fixture.robots[0] }))).toEqual(
      fixture.robots[0],
    );
  });

  it.each(["{", "null", '{"robots":null}', '{"robot":{}}'])(
    "ignores malformed payloads: %s",
    (payload) => {
      expect(parseFleetSnapshot(payload)).toBeNull();
      expect(parseRobotUpdate(payload)).toBeNull();
    },
  );

  it("rejects non-hex colors in both snapshots and updates without accepting a partial fleet", () => {
    const robot = { ...fixture.robots[0], color: "red" };

    expect(parseFleetSnapshot(JSON.stringify({ robots: [fixture.robots[1], robot] }))).toBeNull();
    expect(parseRobotUpdate(JSON.stringify({ robot }))).toBeNull();
  });
});
