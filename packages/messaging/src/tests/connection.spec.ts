import assert from "node:assert/strict";
import { test } from "node:test";
import { queuePrefix, redisConnection } from "../connection.js";

test("parses credentials, database, IPv6, and TLS without exposing secrets", () => {
  const connection = redisConnection("rediss://user:p%40ss%3Aword@[::1]:6380/2");
  assert.equal(connection.host, "::1");
  assert.equal(connection.port, 6380);
  assert.equal(connection.username, "user");
  assert.equal(connection.password, "p@ss:word");
  assert.equal(connection.db, 2);
  assert.deepEqual(connection.tls, {});
  for (const value of [
    "https://user:secret@host",
    "redis://host/not-a-db",
    "redis://host?db=2",
    "redis://host/#2",
    "redis://user:%XX@host",
  ]) {
    assert.throws(
      () => redisConnection(value),
      (error: Error) => {
        assert.match(error.message, /REDIS_URL must be/);
        assert(!error.message.includes(value));
        return true;
      },
    );
  }
});

test("producers fail quickly while workers can reconnect without a request retry limit", () => {
  const producer = redisConnection("redis://localhost");
  assert.equal(producer.port, 6379);
  assert.equal(producer.db, 0);
  assert.equal(producer.maxRetriesPerRequest, 1);
  assert.equal(producer.enableOfflineQueue, false);
  assert.equal(producer.commandTimeout, 5_000);
  const worker = redisConnection("redis://localhost", "worker");
  assert.equal(worker.maxRetriesPerRequest, null);
  assert.equal(worker.enableOfflineQueue, true);
  assert.equal(worker.commandTimeout, undefined);
});

test("uses the app name directly to isolate applications", () => {
  assert.equal(queuePrefix("robofleet"), "robofleet");
  assert.notEqual(queuePrefix("robofleet"), queuePrefix("other-app"));
  for (const value of ["", " ", ":", "app:*", "app::prod"])
    assert.throws(() => queuePrefix(value), /namespace/);
});
