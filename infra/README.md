# Infra

Docker Compose runs Caddy as the public reverse proxy and two app containers on the internal
Compose network.

## Services

- `caddy`: terminates HTTP/HTTPS and proxies by hostname.
- `bugraaydingoz-web`: builds `apps/bugraaydingoz-web` and serves the static Astro output on port `3000`.
- `myanaesthesie-web`: builds `apps/myanaesthesie-web` and serves the static Vite output on port `3000`.

## Run

```sh
docker compose -f infrastructure/docker-compose.yml up -d --build
```

The Caddy routes are:

- `bugraaydingoz.com` -> `bugraaydingoz-web:3000`
- `myanaesthesie.bugraaydingoz.com` -> `myanaesthesie-web:3000`
