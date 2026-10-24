FROM node:24-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/robofleet-api/package.json apps/robofleet-api/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter robofleet-api...

COPY apps/robofleet-api apps/robofleet-api

RUN pnpm --filter robofleet-api check && pnpm --filter robofleet-api build

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/robofleet-api/package.json apps/robofleet-api/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --prod --filter robofleet-api...

COPY --from=builder /app/apps/robofleet-api/dist apps/robofleet-api/dist
COPY --from=builder /app/apps/robofleet-api/drizzle/migrations apps/robofleet-api/drizzle/migrations

USER node

EXPOSE 3000

CMD ["node", "apps/robofleet-api/dist/index.js"]
