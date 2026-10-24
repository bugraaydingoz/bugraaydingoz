# RoboFleet Web

React UI built with Vite, TypeScript, TanStack Query, Hono's typed client, and Tailwind CSS 4.

## Development

From the repository root:

```sh
pnpm install
pnpm dev:robofleet
```

Configure the env files as described in `infra/README.md`. Docker must be running. The command
starts shared Postgres and applies migrations before starting the apps.
The UI runs on `http://localhost:5173` and forwards `/api` to the Hono API on
`http://localhost:3000`. Set `ROBOFLEET_API_URL` to change the development or preview proxy
target. Redis is deferred. Ctrl+C stops the apps while leaving the shared database running.

## Structure

- `src/components`: application components, with PascalCase filenames.
- `src/components/ui`: shadcn/ui components, with one file per component.
- `src/test/setup.ts`: shared Vitest setup; unit tests stay beside their source.
- `tests`: Playwright browser tests, kept flat.
- `@repo/design-tokens`: shared shadcn variables, light/dark palettes, and Tailwind mappings.
- `src/utils/api.ts`: the typed Hono client and request functions.
- `src/utils/utils.ts`: shared UI utilities.

Tailwind uses the Vite plugin and `src/index.css`. The local component aliases are configured in
`components.json`, Vite, and TypeScript. The app uses the shadcn Nova/Base UI foundation
with the shared neutral palette. `src/index.css` imports `@repo/design-tokens/tokens.css` and
`@repo/design-tokens/tailwind.css` directly; there is no duplicate local theme. Animations
come from `tw-animate-css`. The default theme is light; adding `.dark` to `<html>` activates
the shared dark palette.

The Button follows the official shadcn Nova Base UI component with React 18 ref forwarding and the
existing local `cn` utility. Composition uses Base UI’s `render` prop. To add components,
run the official CLI from this app:

```sh
pnpm dlx shadcn@latest add @shadcn/<component>
```

The CLI writes components directly to `src/components/ui`. Reuse `@/utils/utils` for `cn`,
and keep color/radius variables in the shared design-tokens package.

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
API proxy, and covers the unavailable-API state. Browser tests live in `tests/*.spec.ts`.

## Deployment

Docker and Caddy configuration lives in `infra/`. See the repository's `infra/README.md` for
the Compose command and hostname routing. Both the UI and API have dedicated Dockerfiles.
