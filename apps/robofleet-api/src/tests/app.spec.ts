import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../app";
import { databaseUrl } from "../db";

test("liveness remains available without a database", async () => {
  const app = createApp();
  const response = await app.request("/api/health?check=ready");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ready" });
  assert.equal((await app.request("/api/ready")).status, 503);
});

test("readiness checks the database and handles connection failure", async () => {
  let checks = 0;
  const healthy = createApp({
    checkDatabase: async () => {
      checks++;
    },
  });

  assert.equal((await healthy.request("/api/ready")).status, 200);
  assert.equal(checks, 1);

  const unavailable = createApp({
    checkDatabase: async () => {
      throw new Error("private database details");
    },
  });
  const response = await unavailable.request("/api/ready");

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "unavailable", database: "unavailable" });
});

test("database configuration rejects malformed URLs without exposing credentials", () => {
  assert.throws(() => databaseUrl(""), /DATABASE_URL is required/);
  assert.throws(() => databaseUrl("https://example.com/database"), /PostgreSQL URL/);
  assert.throws(() => databaseUrl("postgresql://user:secret@localhost"), /PostgreSQL URL/);
  assert.equal(
    databaseUrl("postgresql://user:password@localhost/robofleet"),
    "postgresql://user:password@localhost/robofleet",
  );
});

test("readiness includes messaging and distinguishes a Redis failure", async () => {
  const app = createApp({
    checkDatabase: async () => {},
    checkMessaging: async () => {
      throw new Error("private Redis details");
    },
  });
  const response = await app.request("/api/ready");

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: "unavailable",
    database: "ok",
    messaging: "unavailable",
  });
  assert.equal((await createApp().request("/api/robots")).status, 503);
});
