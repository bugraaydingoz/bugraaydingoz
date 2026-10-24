FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bugraaydingoz-web/package.json apps/bugraaydingoz-web/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter bugraaydingoz-web...

COPY apps/bugraaydingoz-web apps/bugraaydingoz-web
COPY packages/design-tokens packages/design-tokens

RUN pnpm --filter bugraaydingoz-web build

FROM caddy:2-alpine

COPY infra/bugraaydingoz-web.Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/bugraaydingoz-web/dist /srv

EXPOSE 3000
