# Infra

[Docker Compose](docker-compose.yml) runs the apps, Caddy, and shared PostgreSQL 18.
[Caddyfile](Caddyfile) defines the domain routes. Run commands from the repository root.

## Local development

```sh
cp .env.example .env.local
cp apps/robofleet-api/.env.example apps/robofleet-api/.env.local
```

Set `POSTGRES_PASSWORD` and the API's `PGPASSWORD` to the same value.
Generate one with `openssl rand -hex 24`. Then:

```sh
pnpm db:up
pnpm db:compose exec -T postgres createdb -U postgres robofleet # First setup only
pnpm dev:robofleet
```

Postgres is available at `127.0.0.1:5432`. Stop it with `pnpm db:compose stop postgres`.

For database tests:

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
# Set POSTGRES_PASSWORD in .env before continuing.
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
