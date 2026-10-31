import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fleetMapSchema,
  fleetRobotSchema,
  mapsResponseSchema,
  robotsResponseSchema,
  robotUpdateSchema,
  telemetrySchema,
  type FleetMap,
  type FleetRobot,
} from "../contracts";

const map: FleetMap = {
  id: "hotel",
  name: "Hotel",
  version: 1,
  definition: {
    width: 100,
    depth: 100,
    metresPerUnit: 1,
    viewBox: { width: 100, height: 100 },
    projection: { x: 0, y: 0, scaleX: 1, scaleY: 0.5 },
    asset: "hotel-courtyard",
    nodes: [[0, 0]],
    edges: [],
    destinations: [],
  },
};

const robot: FleetRobot = {
  version: 1,
  eventId: "00000000-0000-0000-0000-000000000000",
  robotId: "AMR-001",
  name: "Atlas",
  color: "#79bca0",
  generation: 1,
  sequence: 1,
  recordedAt: "2026-10-31T12:00:00.000Z",
  mapId: map.id,
  mapVersion: map.version,
  position: { x: 0, y: 0, heading: 0 },
  status: "Idle",
  battery: 80,
  speedMps: 0,
  location: "Reception",
  destination: null,
  detail: "Ready",
  task: null,
  route: [],
  receivedAt: null,
  lastSeenAt: null,
  sampleAgeMs: null,
};

test("validates robot and map responses, including empty lists and offline robots", () => {
  assert.deepEqual(robotsResponseSchema.parse({ robots: [] }), { robots: [] });
  assert.deepEqual(mapsResponseSchema.parse({ maps: [] }), { maps: [] });
  assert.deepEqual(mapsResponseSchema.parse({ maps: [map] }), { maps: [map] });
  assert.deepEqual(robotsResponseSchema.parse({ robots: [robot] }), { robots: [robot] });
  const offline = { ...robot, status: "Offline" as const, color: "#ABCDEF" };
  assert.deepEqual(robotUpdateSchema.parse({ robot: offline }), { robot: offline });
  assert.equal(fleetRobotSchema.parse({ ...robot, speedMps: undefined }).speedMps, 0);
});

for (const [field, value] of [
  ["color", "red"],
  ["color", "#abc"],
  ["color", '#ffffff" onload="alert(1)'],
  ["battery", 101],
  ["sampleAgeMs", -1],
  ["sampleAgeMs", Infinity],
  ["sequence", 1.5],
  ["mapVersion", 0],
  ["lastSeenAt", "yesterday"],
  ["position", { x: NaN, y: 0, heading: 0 }],
  ["position", { x: 0, y: 0, heading: Infinity }],
] as const) {
  test(`rejects invalid robot ${field}: ${JSON.stringify(value)}`, () => {
    const invalid = { ...robot, [field]: value };

    assert.equal(fleetRobotSchema.safeParse(invalid).success, false);
    assert.equal(robotsResponseSchema.safeParse({ robots: [robot, invalid] }).success, false);
    assert.equal(robotUpdateSchema.safeParse({ robot: invalid }).success, false);
  });
}

test("rejects invalid map dimensions, projections, versions, and corridor references", () => {
  for (const definition of [
    { ...map.definition, width: Infinity },
    { ...map.definition, metresPerUnit: 0 },
    { ...map.definition, viewBox: { width: 100, height: -1 } },
    { ...map.definition, projection: { ...map.definition.projection, x: Infinity } },
    { ...map.definition, projection: { ...map.definition.projection, scaleX: 0 } },
    { ...map.definition, edges: [[0, 1]] },
    { ...map.definition, destinations: [{ name: "Room", point: [0, 0], node: 1, via: [] }] },
  ]) {
    assert.equal(mapsResponseSchema.safeParse({ maps: [{ ...map, definition }] }).success, false);
  }

  assert.equal(fleetMapSchema.safeParse({ ...map, version: 1.5 }).success, false);
});

test("permits additive response fields while keeping telemetry input strict", () => {
  assert.deepEqual(fleetRobotSchema.parse({ ...robot, extra: true }), robot);
  assert.deepEqual(fleetMapSchema.parse({ ...map, extra: true }), map);
  const telemetry = telemetrySchema.strip().parse(robot);

  assert.deepEqual(telemetrySchema.parse(telemetry), telemetry);
  assert.equal(telemetrySchema.safeParse({ ...telemetry, extra: true }).success, false);
});
