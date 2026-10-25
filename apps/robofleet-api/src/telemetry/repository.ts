import { RETENTION_MS, type Telemetry } from "../contracts";
import type { Database } from "../maps/repository";

export class InvalidTelemetry extends Error {}

export function createTelemetryRepository(database: Database) {
  async function accept(message: Telemetry, receivedAt = new Date()) {
    if (receivedAt.getTime() < Date.now() - RETENTION_MS) return false;

    if (Date.parse(message.recordedAt) > Date.now() + 5000)
      throw new InvalidTelemetry("Telemetry time is in the future");

    return database.client.begin(async (tx) => {
      const [robot] =
        await tx`select generation, profile from robots where id=${message.robotId} for update`;

      if (!robot?.profile) throw new InvalidTelemetry("Unknown robot");

      const [map] =
        await tx`select definition from map_versions where map_id=${message.mapId} and version=${message.mapVersion}`;

      if (
        !map ||
        message.position.x < 0 ||
        message.position.y < 0 ||
        message.position.x > map.definition.width ||
        message.position.y > map.definition.depth
      )
        throw new InvalidTelemetry("Invalid map or position");

      if (message.generation > robot.generation)
        throw new InvalidTelemetry("Unregistered producer generation");

      const inserted =
        await tx`insert into robot_telemetry (event_id,robot_id,generation,sequence,payload,received_at) values (${message.eventId},${message.robotId},${message.generation},${message.sequence},${JSON.stringify(message)}::jsonb,${receivedAt.toISOString()}) on conflict do nothing returning event_id`;

      if (!inserted.length) return false;

      if (message.generation !== robot.generation) return false;

      const rows =
        await tx`insert into robot_state (robot_id,generation,sequence,payload,received_at) values (${message.robotId},${message.generation},${message.sequence},${JSON.stringify(message)}::jsonb,${receivedAt.toISOString()}) on conflict (robot_id) do update set generation=excluded.generation,sequence=excluded.sequence,payload=excluded.payload,received_at=excluded.received_at where (robot_state.generation,robot_state.sequence)<(excluded.generation,excluded.sequence) returning robot_id`;

      if (rows.length)
        await tx`update robots set status=${message.status},updated_at=now() where id=${message.robotId}`;

      return rows.length > 0;
    });
  }

  async function deleteExpired(batchSize = 5000) {
    return database.client.begin(async (tx) => {
      const [lock] =
        await tx`select pg_try_advisory_xact_lock(hashtext('robofleet:telemetry-retention')) as acquired`;

      if (!lock.acquired) return 0;

      const rows =
        await tx`delete from robot_telemetry where event_id in (select event_id from robot_telemetry where received_at < now()-interval '1 hour' order by received_at limit ${batchSize}) returning event_id`;

      return rows.length;
    });
  }

  return { accept, deleteExpired };
}
