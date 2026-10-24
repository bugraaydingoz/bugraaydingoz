# Infra

Docker Compose runs Caddy as the public reverse proxy and the app containers on the internal
Compose network.

## Services

- `caddy`: terminates HTTP/HTTPS and proxies by hostname.
- `bugraaydingoz-web`: builds `apps/bugraaydingoz-web` and serves the static Astro output on port `3000`.
- `myanaesthesie-web`: builds `apps/myanaesthesie-web` and serves the static Vite output on port `3000`.
- `robofleet-web`: builds `apps/robofleet-web`, serves the static Vite output on port `3000`, and proxies `/api` requests to `robofleet-api`.
- `robofleet-api`: builds `apps/robofleet-api` and runs the Hono server on port `3000` with Node.js and production dependencies.

## Run

```sh
docker compose -f infra/docker-compose.yml up -d --build
```

The Caddy routes are:

- `bugraaydingoz.com` -> `bugraaydingoz-web:3000`
- `myanaesthesie.bugraaydingoz.com` -> `myanaesthesie-web:3000`
- `robofleet.bugraaydingoz.com` -> `robofleet-web:3000`, with `/api` forwarded internally to `robofleet-api:3000`.

The RoboFleet Dockerfiles use Node.js 24 and pnpm 12.15.0. Point the RoboFleet hostname at the
deployment host before enabling its Caddy route. Postgres and Redis will be added separately.
