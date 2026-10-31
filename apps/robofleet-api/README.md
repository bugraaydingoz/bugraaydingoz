# RoboFleet backend

A Hono API that runs the robot simulator, processes telemetry through Redis, and
stores fleet data in Postgres. It streams saved updates to the web app and keeps
one hour of telemetry history.

See the [RoboFleet overview](../robofleet-web/README.md) for architecture,
development, test, and deployment commands. Set `SIMULATOR_ENABLED=false` in the
backend environment to disable simulated robots.

## Endpoints

All endpoints are read-only.

| Path                                          | Returns                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `/api/health`                                 | Server health                                    |
| `/api/ready`                                  | Database and queue readiness                     |
| `/api/maps`                                   | Active maps                                      |
| `/api/maps/:id?version=1`                     | A map version                                    |
| `/api/robots`                                 | Fleet and latest state                           |
| `/api/robots/:id`                             | One robot                                        |
| `/api/robots/:id/telemetry?limit=50&before=…` | Recent history with pagination                   |
| `/api/events`                                 | Live `fleet.snapshot` and `robot.updated` events |

## Database changes

Edit `drizzle/schema.ts`, then generate, review, and apply migrations.
Run from the repository root:

```sh
pnpm --filter robofleet-api db:generate --name describe_change
pnpm --filter robofleet-api db:migrate
```
