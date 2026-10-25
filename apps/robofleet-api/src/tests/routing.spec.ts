import assert from "node:assert/strict";
import { test } from "node:test";
import { mapDefinitionSchema, telemetrySchema, type MapDefinition } from "../contracts";
import { advance, mapRoute, routeLength } from "../maps/routing";

const map: MapDefinition = {
  width: 100,
  depth: 100,
  metresPerUnit: 1,
  viewBox: { width: 100, height: 100 },
  projection: { x: 0, y: 0, scaleX: 1, scaleY: 0.5 },
  asset: "test",
  nodes: [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ],
  destinations: [
    { name: "Room", node: 1, point: [100, 20], via: [] },
    { name: "Service", node: 3, point: [20, 100], via: [[10, 100]] },
  ],
};

test("routes along the shortest graph path and uses room entries in both directions", () => {
  const forward = mapRoute(map, [20, 100], "Room");

  assert.deepEqual(forward, [
    [20, 100],
    [10, 100],
    [0, 100],
    [0, 0],
    [100, 0],
    [100, 20],
  ]);
  assert.equal(routeLength(forward), 240);
  assert.deepEqual(mapRoute(map, [100, 20], "Service"), [...forward].reverse());
  assert.throws(() => mapRoute({ ...map, edges: [] }, [0, 0], "Room"), /disconnected/);
});

test("movement spends distance across corners without cutting through the courtyard", () => {
  const result = advance(
    [
      [0, 0],
      [10, 0],
      [10, 10],
    ],
    15,
  );

  assert.deepEqual(result.point, [10, 5]);
  assert.deepEqual(result.route, [
    [10, 5],
    [10, 10],
  ]);
  assert.equal(result.heading, 90);
  assert.deepEqual(advance(result.route, 20).point, [10, 10]);
});

test("validates persisted maps and rejects malformed telemetry", () => {
  assert.equal(mapDefinitionSchema.safeParse({ ...map, edges: [[0, 99]] }).success, false);
  assert.equal(telemetrySchema.safeParse({ robotId: "AMR-001", battery: 200 }).success, false);
});
