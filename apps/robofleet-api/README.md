# RoboFleet API

Hono/Zod API with Postgres, Drizzle, and the shared BullMQ messaging package.

## Development

Configure the root `.env.local` and `apps/robofleet-api/.env.local` from their examples,
then run `pnpm dev:robofleet` from the root. This starts shared Postgres and Redis,
builds messaging, migrates the database, and starts the API and UI.

The API loads the root env first and its own env second. `PGPASSWORD` must match the
root `POSTGRES_PASSWORD`. `REDIS_URL` selects the Redis host/port; root `REDIS_PASSWORD`
is applied with URL encoding. The Compose deployment supplies both automatically.
Set `SIMULATOR_ENABLED=false` to run ingestion and HTTP without simulated publishers.

## Pipeline

- `simulator`: one scheduler, independent robot state, one sample per robot per tick
  (approximately one second). Working robots follow the persisted corridor graph,
  finish deliveries, and choose another room. Scenarios include charging, temporary
  obstacles, idle robots, and a robot disconnecting/reconnecting every minute.
- `telemetry`: validates messages, queues them via `@repo/messaging`, and consumes them
  in a worker. Queue name `telemetry`, namespace `robofleet`; all keys begin
  `robofleet:telemetry:`, without library or environment prefixes.
- `maps`: reads versioned map definitions from Postgres. The telemetry migration seeds
  the supplied hotel graph, destinations, dimensions, projection, and illustration
  asset reference. Runtime map data does not come from UI JavaScript fixtures.
- `robots`: reads current persisted state and one-hour telemetry history.
- `events`: publishes committed state over SSE. Each connection starts with a fresh
  snapshot; updates are coalesced by robot for slow clients. Five-second snapshots
  recover missed notifications and derive offline status after ten seconds without
  telemetry. Reconnecting restores current state rather than replaying old events.

HTTP, the worker, retention, and the simulator run in one Node process. A dedicated
Postgres advisory lock prevents duplicate simulators. Each restart increments producer
generations and resumes the latest persisted robot positions; sequence numbers order
messages within a generation. The SSE notification hub is local to this process;
horizontal deployment and cross-process event fan-out are deferred.

A transaction inserts history and conditionally replaces latest state. Duplicate
`eventId` and `(robotId, generation, sequence)` values cannot create repeated history;
older generations/sequences cannot overwrite newer state. Jobs complete after commit;
transient errors retry, invalid payloads fail without retry. SIGTERM stops publishers,
closes SSE, drains the worker, and releases Redis/DB connections.

## Retention

Raw telemetry is retained for **one hour**, measured by server-assigned queue receipt
time, preserved across retries. Cleanup runs at startup and every minute, in batches
of at most 5,000 rows (at most ten batches per pass), guarded by a transaction advisory
lock. History endpoints immediately exclude expired rows. Late jobs older than one
hour are discarded. Current robot state, maps, and robot identities are not deleted.

At eight samples/second, the rolling hour contains about 28,800 history rows. Normal
Postgres autovacuum reuses space freed by cleanup. Completed telemetry jobs are removed
immediately; failed queue jobs have a one-hour/1,000-job retention limit, cleaned lazily
by BullMQ as more jobs fail.

## Endpoints

| Method | Path                                          | Result                                             |
| ------ | --------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/health`                                 | Process liveness                                   |
| GET    | `/api/ready`                                  | Database and Redis/worker readiness                |
| GET    | `/api/maps`                                   | Maps at their active versions                      |
| GET    | `/api/maps/:id?version=1`                     | A specific persisted map version                   |
| GET    | `/api/robots`                                 | Fleet with latest state and derived offline status |
| GET    | `/api/robots/:id`                             | One robot                                          |
| GET    | `/api/robots/:id/telemetry?limit=50&before=…` | History with opaque cursor; limit 1–100            |
| GET    | `/api/events`                                 | `fleet.snapshot` and `robot.updated` SSE events    |

The API exposes read endpoints only. Simulator configuration and maps are currently
seeded by migrations; map editing and task-control endpoints are future work. The
existing hotel SVG is a static illustration asset; new visual assets/renderers can
be associated with future map versions.

## Database changes and checks

Edit `drizzle/schema.ts`, then generate and review migrations:

```sh
pnpm --filter robofleet-api db:generate --name describe_change
pnpm --filter robofleet-api db:migrate
pnpm --filter robofleet-api lint
pnpm --filter robofleet-api check
pnpm --filter robofleet-api test
pnpm --filter robofleet-api build
pnpm db:test:robofleet
```

Integration tests require the dedicated `robofleet_test` database plus Redis. The
telemetry suite also accepts explicit `TEST_DATABASE_URL` and `REDIS_URL`; tests use
unique `robofleet:test-…` queue namespaces and delete only their own queue resources.
They exercise migrations, deduplication, ordering, retention, pagination, a real Redis
worker, SSE, movement, and simulator ownership. Database URLs must end in `_test`.

The API can still start without database configuration for isolated UI tests; fleet
endpoints return 503 and readiness fails. UI browser tests use fixed HTTP/SSE fixtures
for deterministic interactions; the API integration suite exercises real services.
