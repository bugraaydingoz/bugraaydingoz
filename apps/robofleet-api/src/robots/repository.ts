import {
  OFFLINE_MS,
  RETENTION_MS,
  type FleetRobot,
  type RobotProfile,
  type Telemetry,
} from "../contracts";
import type { Database } from "../maps/repository";

export function createRobotRepository(database: Database) {
  async function read(id?: string): Promise<FleetRobot[]> {
    const rows =
      await database.client`select r.id,r.name,r.profile,r.generation,s.payload,s.received_at from robots r left join robot_state s on s.robot_id=r.id where r.profile is not null and (${id ?? null}::text is null or r.id=${id ?? null}) order by r.id`;

    return rows.map((row) => {
      const profile = row.profile as RobotProfile;
      const message = row.payload as Telemetry | null;
      const lastSeenAt = message?.recordedAt ?? null;

      return {
        ...profile.initial,
        version: 1 as const,
        eventId: "00000000-0000-0000-0000-000000000000",
        robotId: row.id,
        generation: row.generation,
        sequence: 0,
        recordedAt: new Date(0).toISOString(),
        ...message,
        name: row.name,
        color: profile.color,
        status:
          !lastSeenAt || Date.now() - Date.parse(lastSeenAt) > OFFLINE_MS
            ? ("Offline" as const)
            : message!.status,
        detail: !lastSeenAt
          ? "No telemetry received yet."
          : Date.now() - Date.parse(lastSeenAt) > OFFLINE_MS
            ? "Connection lost. Showing last-known telemetry."
            : message!.detail,
        speedMps: message?.speedMps ?? 0,
        sampleAgeMs: lastSeenAt ? Math.max(0, Date.now() - Date.parse(lastSeenAt)) : null,
        lastSeenAt,
        receivedAt: row.received_at ? new Date(row.received_at).toISOString() : null,
      };
    });
  }

  async function get(id: string) {
    return (await read(id))[0];
  }

  async function history(id: string, limit: number, before?: { at: string; id: string }) {
    const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
    const rows =
      await database.client`select event_id, received_at, payload from robot_telemetry where robot_id=${id} and received_at >= ${cutoff} and (${before?.at ?? null}::timestamptz is null or (received_at,event_id) < (${before?.at ?? null}::timestamptz,${before?.id ?? null}::uuid)) order by received_at desc, event_id desc limit ${limit + 1}`;
    const page = rows.slice(0, limit),
      last = page.at(-1);

    return {
      events: page.map((r) => ({
        ...r.payload,
        receivedAt: new Date(r.received_at).toISOString(),
      })),
      nextCursor:
        rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({ at: new Date(last.received_at).toISOString(), id: last.event_id }),
            ).toString("base64url")
          : null,
    };
  }

  return { list: () => read(), get, history };
}
