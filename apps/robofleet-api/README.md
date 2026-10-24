# RoboFleet API

Hono and Zod API with Postgres.js and Drizzle. Configure the root and API env files as described
in `infra/README.md`, then start the shared development database and both apps from the root:

```sh
pnpm dev:robofleet
```

This starts Postgres, applies migrations, and launches the API on port `3000` and UI on port
`5173`. Docker must be running. The API loads `DATABASE_URL` and `PGPASSWORD` from its ignored
`.env.local` file. The database currently uses the built-in `postgres` user.

## Database changes

Edit `drizzle/schema.ts`, then generate and review the SQL migration:

```sh
pnpm --filter robofleet-api db:generate --name describe_change
```

Commit the SQL migration and Drizzle metadata with the schema change. `db:generate` does not
connect to a database. `pnpm dev:robofleet` applies outstanding migrations automatically. To apply
them separately, set `DATABASE_URL` and run `pnpm --filter robofleet-api db:migrate`.

The migration runner uses one connection and a Postgres advisory lock so concurrent migration
processes serialize. Applied migrations are tracked in Drizzle's journal. Production builds
include `dist/migrate.js` and the SQL migration files; Compose runs that entrypoint once before
starting the API.

## Health checks

- `/api/health`: process liveness, independent of database availability.
- `/api/ready`: `200` when Postgres is reachable, `503` when unavailable or unconfigured.

The API can start without `DATABASE_URL` for isolated UI tests; it will not report database
readiness. Local development and deployment always configure the database.

## Validation

```sh
pnpm --filter robofleet-api lint
pnpm --filter robofleet-api check
pnpm --filter robofleet-api test
pnpm --filter robofleet-api build
pnpm db:test:robofleet
```

Unit tests use Node's test runner through tsx. Database integration tests use a dedicated
`robofleet_test` database and require Docker. Create it once with the command in `infra/README.md`,
which also documents credentials, backups, and restoration.
