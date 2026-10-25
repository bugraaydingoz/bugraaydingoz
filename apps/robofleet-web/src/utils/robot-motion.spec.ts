import { describe, expect, it } from "vitest";
import {
  CORRECTION_MS,
  PREDICTION_MS,
  evaluateMotion,
  reconcileMotion,
  type MotionSample,
} from "./robot-motion";

function sample(overrides: Partial<MotionSample> = {}): MotionSample {
  return {
    id: "robot",
    generation: 1,
    sequence: 1,
    mapId: "hotel",
    mapVersion: 1,
    position: { x: 0, y: 0, heading: 0 },
    route: [
      [0, 0],
      [10, 0],
    ],
    speedMps: 1,
    sampleAgeMs: 0,
    status: "Working",
    destination: "Room",
    task: null,
    ...overrides,
  };
}

function close(actual: number, expected: number) {
  expect(actual).toBeCloseTo(expected, 5);
}

describe("Robot display prediction", () => {
  it("moves between packets in map units and freezes at the prediction horizon", () => {
    const model = reconcileMotion(undefined, sample(), 0, 0.5);
    close(evaluateMotion(model, 250).pose.x, 0.5);
    close(evaluateMotion(model, 500).pose.x, 1);
    const stopped = evaluateMotion(model, PREDICTION_MS);
    close(stopped.pose.x, 3);
    expect(stopped.active).toBe(false);
    close(evaluateMotion(model, 60_000).pose.x, 3);
  });

  it("does not extend prediction for repeated snapshots, UI hover, or stale packets", () => {
    const packet = sample(),
      model = reconcileMotion(undefined, packet, 0, 1);
    const repeated = reconcileMotion(model, { ...packet, sampleAgeMs: 1000 }, 1000, 1);
    expect(repeated).toBe(model);
    expect(reconcileMotion(model, sample({ sequence: 0 }), 1100, 1)).toBe(model);
    expect(reconcileMotion(model, sample({ generation: 0, sequence: 100 }), 1100, 1)).toBe(model);
    close(evaluateMotion(repeated, 5000).pose.x, 1.5);
  });

  it("incorporates server-reported sample age without relying on client wall time", () => {
    const model = reconcileMotion(undefined, sample({ sampleAgeMs: 500 }), 10_000, 1);
    close(evaluateMotion(model, 10_000).pose.x, 0.5);
    close(evaluateMotion(model, 10_500).pose.x, 1);
    close(evaluateMotion(model, 20_000).pose.x, 1.5);
    const stale = reconcileMotion(undefined, sample({ sampleAgeMs: 2000 }), 0, 1);
    expect(evaluateMotion(stale, 1000).pose.x).toBe(0);
  });

  it("follows corners and joins corrections through the old corridor prefix", () => {
    const packet = sample({
      route: [
        [0, 0],
        [1, 0],
        [1, 2],
      ],
    });
    const model = reconcileMotion(undefined, packet, 0, 1);
    close(evaluateMotion(model, 800).pose.x, 0.8);
    const corrected = reconcileMotion(
      model,
      sample({
        sequence: 2,
        position: { x: 1, y: 0.1, heading: 90 },
        route: [
          [1, 0.1],
          [1, 2],
        ],
      }),
      800,
      1,
    );
    const start = evaluateMotion(corrected, 800).pose;
    close(start.x, 0.8);
    close(start.y, 0);
    const halfway = evaluateMotion(corrected, 900).pose;
    close(halfway.x, 1);
    close(halfway.y, 0.05);
    const settled = evaluateMotion(corrected, 800 + CORRECTION_MS).pose;
    close(settled.x, 1);
    close(settled.y, 0.3);
    expect(settled.route[0]).toEqual([settled.x, settled.y]);
  });

  it("smooths small updates and slows an overshoot without going backwards", () => {
    const first = reconcileMotion(undefined, sample(), 0, 1);
    const correction = reconcileMotion(
      first,
      sample({
        sequence: 2,
        position: { x: 0.3, y: 0, heading: 0 },
        route: [
          [0.3, 0],
          [10, 0],
        ],
      }),
      500,
      1,
    );
    let previous = 0.5;
    for (let time = 500; time <= 1000; time += 20) {
      const current = evaluateMotion(correction, time).pose.x;
      expect(current).toBeGreaterThanOrEqual(previous - 0.000001);
      previous = current;
    }
    close(evaluateMotion(correction, 1000).pose.x, 0.8);
  });

  it("snaps large corrections, map changes, and producer restarts", () => {
    const changes: Partial<MotionSample>[] = [
      {
        position: { x: 5, y: 0, heading: 0 },
        route: [
          [5, 0],
          [10, 0],
        ],
      },
      { mapVersion: 2 },
      { generation: 2 },
    ];

    for (const change of changes) {
      const first = reconcileMotion(undefined, sample(), 0, 1);
      const packet = sample({ sequence: 2, ...change });
      const updated = reconcileMotion(first, packet, 500, 1);
      expect(updated.correction).toBe(0);
      close(evaluateMotion(updated, 500).pose.x, packet.position.x);
    }
  });

  it("stops immediately for nonmoving statuses and supports reduced motion", () => {
    for (const status of ["Blocked", "Idle", "Charging", "Offline"] as const) {
      const first = reconcileMotion(undefined, sample(), 0, 1);
      const packet = sample({ status });
      const stopped = reconcileMotion(first, packet, 500, 1);
      expect(evaluateMotion(stopped, 1000).pose.x).toBe(0);
      expect(evaluateMotion(stopped, 1000).active).toBe(false);
    }
    const reduced = reconcileMotion(undefined, sample(), 0, 1, false);
    expect(evaluateMotion(reduced, 1000).pose.x).toBe(0);
    expect(evaluateMotion(reduced, 1000).active).toBe(false);
    const enabled = reconcileMotion(reduced, sample(), 5000, 1, true);
    expect(evaluateMotion(enabled, 5500).pose.x).toBe(0);
  });

  it("turns across zero by the shortest angle", () => {
    const angle = (1 * Math.PI) / 180;
    const model = reconcileMotion(
      undefined,
      sample({
        position: { x: 0, y: 0, heading: 359 },
        route: [
          [0, 0],
          [10 * Math.cos(angle), 10 * Math.sin(angle)],
        ],
      }),
      0,
      1,
    );
    const heading = evaluateMotion(model, 100).pose.heading;
    expect(heading).toBeGreaterThan(0);
    expect(heading).toBeLessThan(2);
  });
});
