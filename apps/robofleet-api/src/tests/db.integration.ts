import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import { robots } from "../../drizzle/schema";
import { createDatabase } from "../db";
import { migrateDatabase } from "../migrations";

test("migrations are repeatable and preserve robot data", async () => {
  const configuredUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  assert.ok(configuredUrl, "Set TEST_DATABASE_URL or configure the local API env file");

  const target = new URL(configuredUrl);

  if (!process.env.TEST_DATABASE_URL) {
    target.pathname = "/robofleet_test";
  }

  assert.ok(
    target.pathname.endsWith("_test"),
    "Integration tests require a database ending in _test",
  );

  const url = target.toString();

  await Promise.all([migrateDatabase(url), migrateDatabase(url)]);

  const database = createDatabase(url);
  const id = `database-test-${crypto.randomUUID()}`;

  try {
    const [before] =
      await database.client`select count(*)::int as count from drizzle.__drizzle_migrations`;

    await database.db.insert(robots).values({ id, name: "Database test", status: "idle" });
    await migrateDatabase(url);

    const [robot] = await database.db.select().from(robots).where(eq(robots.id, id));

    assert.equal(robot.name, "Database test");

    const [after] =
      await database.client`select count(*)::int as count from drizzle.__drizzle_migrations`;

    assert.equal(after.count, before.count);
  } finally {
    await database.db.delete(robots).where(eq(robots.id, id));
    await database.close();
  }
});
