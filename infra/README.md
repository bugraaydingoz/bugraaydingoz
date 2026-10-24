# Infra

Docker Compose runs Caddy, the app containers, and shared PostgreSQL 18.

## Services

- `caddy`: terminates HTTP/HTTPS and proxies by hostname.
- `bugraaydingoz-web`: serves the static Astro output on port `3000`.
- `myanaesthesie-web`: serves the static Vite output on port `3000`.
- `robofleet-web`: serves the Vite output and forwards `/api` to `robofleet-api`.
- `robofleet-api`: runs the Hono API on port `3000`.
- `postgres`: stores data in the persistent `postgres_data` volume.
- `robofleet-migrate`: applies committed SQL migrations before the API starts.

Postgres initializes the default `postgres` database. Application databases are created separately.
For now, RoboFleet and its migrations use the built-in `postgres` user and the shared Postgres
password. There is no separate RoboFleet password. Redis is deferred.

## Local development

From the repository root:

```sh
cp .env.example .env.local
cp apps/robofleet-api/.env.example apps/robofleet-api/.env.local
```

Generate a password with `openssl rand -hex 24`. Set `POSTGRES_PASSWORD` in the root `.env.local`
and use the same value for `PGPASSWORD` in the API's `.env.local`. These files are ignored by Git
and excluded from Docker build contexts.

Start Postgres and create the application database once:

```sh
pnpm db:up
pnpm db:compose exec -T postgres createdb -U postgres robofleet
```

Skip `createdb` if the database already exists. Then run `pnpm dev:robofleet`.

This starts Postgres, waits for readiness, applies migrations, and starts the API and UI.
Docker must be running. The API loads its local env file using Node's built-in env-file support.
There are no custom orchestration scripts.

Development uses the `bugraaydingoz-dev` Compose project and publishes Postgres only on
`127.0.0.1:5432`. To change the host port, update `POSTGRES_PORT` in the root env file and the
port in the API's `DATABASE_URL`. Ctrl+C stops the apps and leaves Postgres running.

Database commands:

```sh
pnpm db:up
pnpm db:compose stop postgres
```

The volume is mounted at `/var/lib/postgresql`. Changing initialization settings or passwords in
the env file does not modify an existing cluster. Keep the existing password when reusing its
volume; apply schema changes through migrations.

## Database tests

Create the dedicated test database once:

```sh
pnpm db:up
pnpm db:compose exec -T postgres createdb -U postgres robofleet_test
```

Then run `pnpm db:test:robofleet`. Tests use `robofleet_test` with the API's configured connection
credentials and check concurrent migrations, repeatability, and data preservation. They do not
write test rows into the application database. Set `TEST_DATABASE_URL` to use another test database.

## Deployment

```sh
cp .env.example .env
# Set POSTGRES_PASSWORD.
docker compose --env-file .env -f infra/docker-compose.yml up -d --wait postgres
# First setup only: skip this command if robofleet already exists.
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres createdb -U postgres robofleet
docker compose --env-file .env -f infra/docker-compose.yml up -d --build
```

Production does not publish Postgres's port. Startup order is Postgres readiness, migrations,
API readiness, then the UI. Migration failures prevent API startup. `/api/health` checks process
liveness and `/api/ready` checks database connectivity.

The Caddy routes are:

- `bugraaydingoz.com` -> `bugraaydingoz-web:3000`
- `myanaesthesie.bugraaydingoz.com` -> `myanaesthesie-web:3000`
- `robofleet.bugraaydingoz.com` -> `robofleet-web:3000`, with `/api` forwarded to the API.

The RoboFleet images use Node.js 24 and pnpm 12.15.0. Configure the hostname's DNS before deployment.

## Backup and restore

Back up each database separately and copy the dumps off the deployment host:

```sh
mkdir -p backups
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_dump -U postgres -d robofleet -Fc > backups/robofleet.dump
```

Restore into an empty `robofleet` database:

```sh
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_restore -U postgres --no-owner --dbname=robofleet < backups/robofleet.dump
```

The `backups/` directory is excluded from Git and Docker build contexts.
