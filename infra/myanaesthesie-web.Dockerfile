FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/myanaesthesie-web/package.json apps/myanaesthesie-web/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter myanaesthesie-web...

COPY apps/myanaesthesie-web apps/myanaesthesie-web

RUN pnpm --filter myanaesthesie-web exec svelte-kit sync \
	&& pnpm --filter myanaesthesie-web build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "myanaesthesie-web", "preview", "--host", "0.0.0.0", "--port", "3000"]
