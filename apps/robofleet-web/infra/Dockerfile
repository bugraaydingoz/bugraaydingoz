FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/robofleet-web/package.json apps/robofleet-web/package.json
COPY apps/robofleet-api/package.json apps/robofleet-api/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json
COPY packages/messaging/package.json packages/messaging/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter robofleet-web... --filter robofleet-api

COPY apps/robofleet-web apps/robofleet-web
COPY apps/robofleet-api apps/robofleet-api
COPY packages/design-tokens packages/design-tokens
COPY packages/messaging packages/messaging

RUN pnpm --filter @repo/messaging build && pnpm --filter robofleet-web check && pnpm --filter robofleet-web build

FROM caddy:2-alpine

COPY apps/robofleet-web/infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/robofleet-web/dist /srv

EXPOSE 3000
