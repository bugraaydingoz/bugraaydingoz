# Infra

[Docker Compose](docker-compose.yml) runs the apps, Caddy, shared PostgreSQL 18, and Redis 8.
[Caddyfile](Caddyfile) defines the domain routes. Run commands from the repository root.

## Local development

```sh
cp .env.example .env.local
cp apps/robofleet-api/.env.example apps/robofleet-api/.env.local
```

Set `POSTGRES_PASSWORD` and the API's `PGPASSWORD` to the same value. Set a separate
`REDIS_PASSWORD` in the root env file; the API reads it during development. Set a separate `REDIS_PASSWORD` in the root environment file.
Generate one with `openssl rand -hex 24`. Then:

```sh
pnpm db:up
pnpm db:compose exec -T postgres createdb -U postgres robofleet # First setup only
pnpm dev:robofleet
```

Postgres is available at `127.0.0.1:5432`. Stop it with `pnpm db:compose stop postgres`.

Start Redis with `pnpm redis:up`; it is available at `127.0.0.1:6379` for local apps. Run `pnpm test:messaging` to check queue processing against it.

For database/telemetry tests (the command loads both root and API env files):

```sh
pnpm db:compose exec -T postgres createdb -U postgres robofleet_test # First setup only
pnpm db:test:robofleet
```

## Deployment

Use a deployment account with Git, rootless Docker, and Compose. Point DNS to the VPS and
allow inbound TCP ports `80` and `443` in the host and provider firewalls.

First setup, as the deployment account:

```sh
docker context use rootless
systemctl --user enable --now docker
cp .env.example .env
chmod 600 .env
# Set POSTGRES_PASSWORD and REDIS_PASSWORD in .env before continuing.
docker compose --env-file .env -f infra/docker-compose.yml up -d --wait postgres
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres createdb -U postgres robofleet
```

An administrator enables startup after reboot with `sudo loginctl enable-linger <deploy-user>`.
The deployment account needs no sudo access or system `docker` group membership.

Start or update all services:

```sh
docker compose --env-file .env -f infra/docker-compose.yml up -d --build --wait
```

Migrations run before the API starts. Postgres data persists in a volume; changing `.env`
does not change an existing database password. Rootless and system Docker have separate volumes.

### Shared Redis

For existing deployments, add `REDIS_PASSWORD` to `.env` before the next deploy. Generate it with `openssl rand -hex 24`.

```sh
docker compose --env-file .env -f infra/docker-compose.yml up -d --wait redis
```

Redis stays inside Docker in production. Backend apps connect with `REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379/0` and use [the shared messaging package](../packages/messaging/README.md) for queues. Workers belong to the consuming app.

Redis has a 256 MB data limit, a 512 MB container limit, and a half-CPU limit. AOF writes sync every second; an abrupt failure can lose about a second of recent writes. `noeviction` preserves existing jobs at the memory limit but rejects new writes, so monitor queue growth. Data persists in `redis_data`; avoid removing this volume. Copy Redis backups off-server along with database backups.

### GitHub Actions

The [Deploy workflow](../.github/workflows/deploy.yml) updates `/srv/bugraaydingoz` over SSH
and deploys with rootless Docker on pushes to `master`. Manual runs are available in Actions.
The deployment account must own the checkout and have SSH and Git access.

Add these repository secrets:

- `DEPLOY_HOST`: server IP or hostname.
- `DEPLOY_USER`: deployment account username.
- `DEPLOY_SSH_KEY`: deployment private SSH key.
- `DEPLOY_KNOWN_HOSTS`: verified matching line from `~/.ssh/known_hosts`.

## Backup and restore

```sh
mkdir -p backups
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_dump -U postgres -d robofleet -Fc > backups/robofleet.dump
# Restore into an empty robofleet database:
docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_restore -U postgres --no-owner --dbname=robofleet < backups/robofleet.dump
```

Copy backups off the server. Environment files and `backups/` are excluded from Git.

### RoboFleet telemetry

The API image includes the shared messaging package. Compose waits for Redis and
Postgres/migrations before starting the API, worker, and simulator. Telemetry jobs
use `robofleet:telemetry:…` keys in shared Redis. The migration seeds the hotel map
and eight robots; raw telemetry expires after one hour. SSE uses the existing
same-origin `/api/events` proxy through Caddy. See the API README for contracts and
retention behavior.
