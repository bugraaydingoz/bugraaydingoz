FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/myanaesthesie-web/package.json apps/myanaesthesie-web/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter myanaesthesie-web...

COPY apps/myanaesthesie-web apps/myanaesthesie-web

RUN pnpm --filter myanaesthesie-web build

FROM caddy:2-alpine

COPY infra/myanaesthesie-web.Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/myanaesthesie-web/dist /srv

EXPOSE 3000
