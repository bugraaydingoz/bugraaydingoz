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

### Automatic deployment

The [Deploy workflow](../.github/workflows/deploy.yml) runs on pushes to `master`. It can also be
started manually from GitHub Actions by selecting **Deploy → Run workflow** on `master`.
Deployments run one at a time.

The workflow connects to the server over SSH, updates the checkout at `/srv/bugraaydingoz`
to the latest `master`, and runs `sudo -n /usr/local/sbin/deploy-bugraaydingoz`.

#### Server prerequisites

Replace `<deploy-user>` with your deployment account username.

- Install Git, Docker, and the Docker Compose plugin.
- Keep the repository at `/srv/bugraaydingoz`, owned by the `<deploy-user>` user.
- Add the deployment SSH public key to `/home/<deploy-user>/.ssh/authorized_keys`.
- Ensure `<deploy-user>` can run `git fetch origin`; private repositories require separate GitHub credentials.
- Complete the initial database setup described above.
- Create `/usr/local/sbin/deploy-bugraaydingoz` as a root-owned script that rebuilds and starts
  the Docker Compose services and waits for them to be running or healthy.
- Allow `<deploy-user>` to run only that script without a password using the following sudoers rule:

  ```sudoers
  <deploy-user> ALL=(root) NOPASSWD: /usr/local/sbin/deploy-bugraaydingoz ""
  ```

Keep the script, production Compose configuration, Dockerfiles, and environment file under
administrator control, outside the writable checkout (for example, `/etc/bugraaydingoz`).
Use the existing Compose project name to preserve database volumes. Configuration changes
require an administrator to update the protected files separately. The `<deploy-user>` user does
not need general sudo access or Docker group membership.

#### GitHub secrets

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret               | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| `DEPLOY_HOST`        | Server IP address or hostname                                    |
| `DEPLOY_USER`        | `<deploy-user>`                                                  |
| `DEPLOY_SSH_KEY`     | Private SSH key matching the authorized public key on the server |
| `DEPLOY_KNOWN_HOSTS` | Verified server host-key entry matching `DEPLOY_HOST`            |

Use the complete matching line from your local `~/.ssh/known_hosts` for
`DEPLOY_KNOWN_HOSTS`; hashed hostnames are supported. Never commit private keys or production
environment files. Check deployment results and failures in the GitHub **Actions** tab.

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
