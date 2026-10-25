import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createDatabase } from "../db";
import { migrateDatabase } from "../migrations";
import { createTelemetryRepository } from "../telemetry/repository";
import { createRobotRepository } from "../robots/repository";
import { createMapRepository } from "../maps/repository";
import { createTelemetryProducer } from "../telemetry/producer";
import { startTelemetryWorker } from "../telemetry/worker";
import { startSimulator } from "../simulator/simulator";
import { createEventHub } from "../events/hub";
import { createApp } from "../app";
import type { RobotProfile, Telemetry } from "../contracts";

const configured = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

assert.ok(configured, "Configure a test database");

const target = new URL(configured);

if (!process.env.TEST_DATABASE_URL) target.pathname = "/robofleet_test";

assert.ok(
  target.pathname.endsWith("_test"),
  "Integration tests require a database ending in _test",
);

async function setup() {
  await migrateDatabase(target.toString());

  return createDatabase(target.toString());
}

async function waitFor(check: () => Promise<boolean>) {
  const deadline = Date.now() + 10_000;

  while (!(await check())) {
    assert.ok(Date.now() < deadline, "Pipeline timed out");
    await delay(25);
  }
}

test(
  "persists idempotently, fences stale producers, pages history, and retains only an hour",
  { timeout: 30_000 },
  async () => {
    const database = await setup(),
      repository = createTelemetryRepository(database),
      robots = createRobotRepository(database),
      maps = createMapRepository(database);
    const id = `test-${crypto.randomUUID()}`;

    try {
      const [seed] = await database.client`select profile from robots where id='AMR-001'`;
      const profile = seed.profile as RobotProfile;

      await database.client`insert into robots(id,name,status,profile,generation)values(${id},'Test','Idle',${JSON.stringify(profile)}::jsonb,2)`;

      const message: Telemetry = {
        ...profile.initial,
        version: 1,
        eventId: crypto.randomUUID(),
        robotId: id,
        generation: 2,
        sequence: 2,
        recordedAt: new Date().toISOString(),
      };

      assert.equal(await repository.accept(message), true);
      assert.equal(await repository.accept(message), false);
      assert.equal(
        await repository.accept({
          ...message,
          eventId: crypto.randomUUID(),
          sequence: 1,
          battery: 1,
        }),
        false,
      );
      assert.equal(
        await repository.accept({
          ...message,
          eventId: crypto.randomUUID(),
          generation: 1,
          sequence: 99,
          battery: 2,
        }),
        false,
      );
      await assert.rejects(
        repository.accept({ ...message, eventId: crypto.randomUUID(), generation: 3 }),
        /Unregistered/,
      );
      assert.equal((await robots.get(id))?.battery, 84);
      assert.equal(
        (
          await database.client`select count(*)::int as n from robot_telemetry where robot_id=${id}`
        )[0].n,
        3,
      );

      const first = await robots.history(id, 1);

      assert.equal(first.events.length, 1);
      assert.ok(first.nextCursor);

      const next = await robots.history(
        id,
        10,
        JSON.parse(Buffer.from(first.nextCursor, "base64url").toString()),
      );

      assert.equal(next.events.length, 2);
      // Received time controls retention, independently of device timestamps.
      await database.client`update robot_telemetry set received_at=now()-interval '61 minutes' where robot_id=${id}`;
      assert.equal((await robots.history(id, 10)).events.length, 0);
      assert.equal(await repository.deleteExpired(2), 2);
      assert.equal(await repository.deleteExpired(2), 1);
      assert.equal((await robots.get(id))?.battery, 84);
      assert.equal(
        await repository.accept(
          { ...message, eventId: crypto.randomUUID(), sequence: 3 },
          new Date(Date.now() - 3_700_000),
        ),
        false,
      );
      await repository.accept({
        ...message,
        eventId: crypto.randomUUID(),
        sequence: 3,
        recordedAt: new Date(Date.now() - 11_000).toISOString(),
      });
      assert.equal((await robots.get(id))?.status, "Offline");

      const map = await maps.get("hotel");

      assert.ok(map);
      assert.equal(map.definition.destinations.length, 16);

      const app = createApp({ database });

      assert.equal((await app.request("/api/robots/missing")).status, 404);
      assert.equal((await app.request(`/api/robots/${id}/telemetry?before=bad`)).status, 400);
      assert.equal((await app.request("/api/maps/hotel?version=99")).status, 404);
    } finally {
      await database.client`delete from robots where id=${id}`;
      await database.close();
    }
  },
);

test(
  "real Redis worker commits before emitting SSE and simulator publishes moving robots",
  { timeout: 30_000 },
  async () => {
    const database = await setup(),
      namespace = `robofleet:test-${crypto.randomUUID()}`,
      hub = createEventHub();
    const producer = createTelemetryProducer({ namespace });
    const worker = startTelemetryWorker(database, hub, { namespace });
    const app = createApp({ database, hub });
    let simulator: Awaited<ReturnType<typeof startSimulator>> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    try {
      await worker.waitUntilReady();

      const response = await app.request("/api/events");

      assert.equal(response.headers.get("content-type"), "text/event-stream");
      reader = response.body!.getReader();

      const initial = await reader.read();

      assert.match(new TextDecoder().decode(initial.value), /fleet.snapshot/);
      simulator = await startSimulator(database, producer);
      assert.equal(simulator.active, true);
      await waitFor(
        async () => !!(await createRobotRepository(database).get("AMR-001"))?.lastSeenAt,
      );

      const first = (await createRobotRepository(database).get("AMR-001"))!;
      let updates = "";

      for (let i = 0; i < 20 && !updates.includes("robot.updated"); i++) {
        const part = await reader.read();

        updates += new TextDecoder().decode(part.value);
      }

      assert.match(updates, /robot.updated/);

      const persisted =
        await database.client`select payload from robot_state where robot_id='AMR-001'`;

      assert.ok(persisted[0]);
      await waitFor(async () => {
        const current = await createRobotRepository(database).get("AMR-001");

        return !!current && current.sequence > first.sequence;
      });

      const second = (await createRobotRepository(database).get("AMR-001"))!;

      assert.notDeepEqual(second.position, first.position);

      const secondSimulator = await startSimulator(database, producer);

      assert.equal(secondSimulator.active, false);
      await secondSimulator.stop();
      assert.equal(producer.queue.toKey("wait"), `${namespace}:telemetry:wait`);
    } finally {
      await simulator?.stop();
      hub.close();
      await reader?.cancel();
      await worker.close();
      await producer.queue.obliterate({ force: true });
      await producer.close();
      await database.close();
    }
  },
);

test("reads dynamic map definitions and historical versions from Postgres", async () => {
  const database = await setup(),
    repository = createMapRepository(database),
    id = `test-map-${crypto.randomUUID()}`;

  try {
    const hotel = (await repository.get("hotel"))!;

    await database.client`insert into maps(id,name,active_version)values(${id},'Another building',2)`;

    for (const version of [1, 2]) {
      const definition = {
        ...hotel.definition,
        asset: "another-building",
        projection: { ...hotel.definition.projection, x: version * 100 },
      };

      await database.client`insert into map_versions(map_id,version,definition)values(${id},${version},${JSON.stringify(definition)}::jsonb)`;
    }

    const app = createApp({ database });
    const current = await (await app.request(`/api/maps/${id}`)).json();

    assert.equal(current.map.version, 2);
    assert.equal(current.map.definition.projection.x, 200);

    const previous = await (await app.request(`/api/maps/${id}?version=1`)).json();

    assert.equal(previous.map.definition.projection.x, 100);
  } finally {
    await database.client`delete from map_versions where map_id=${id}`;
    await database.client`delete from maps where id=${id}`;
    await database.close();
  }
});
