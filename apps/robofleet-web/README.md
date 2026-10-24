# RoboFleet Web

React UI built with Vite, TypeScript, TanStack Query, Hono's typed client, and Tailwind CSS 4.

## Development

From the repository root:

```sh
pnpm install
pnpm dev:robofleet
```

The UI runs on `http://localhost:5173` and forwards `/api` to the Hono API on
`http://localhost:3000`. Set `ROBOFLEET_API_URL` to change the development or preview proxy
target. Database and Redis services are deferred.

## Structure

- `src/lib/components/ui`: local shadcn-style React primitives.
- `src/lib/components/app`: application-specific components.
- `src/lib/styles/theme.css`: local design tokens using shadcn CSS variables.
- `src/lib/api.ts`: the typed Hono client and request functions.
- `src/lib/utils.ts`: shared UI utilities.

Tailwind uses the Vite plugin and `src/app.css`. The local component aliases are configured in
`components.json`, Vite, and TypeScript.

## Validation

Run these commands from `apps/robofleet-web`:

```sh
pnpm lint
pnpm check
pnpm test
```

`pnpm test:unit --run` runs Vitest with React Testing Library and jsdom. Unit tests live beside
the code as `*.spec.tsx` or `*.spec.ts` and cover API loading, success, failure, and interaction.

`pnpm test:e2e` installs Chromium and runs Playwright against a production UI build and the
real API. Playwright starts its own servers on ports `4174` and `3031`, checks the same-origin
API proxy, and covers the unavailable-API state. Browser tests use `*.e2e.ts`.

## Deployment

Docker and Caddy configuration lives in `infra/`. See the repository's `infra/README.md` for
the Compose command and hostname routing. Both the UI and API have dedicated Dockerfiles.
