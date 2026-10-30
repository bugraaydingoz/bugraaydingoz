# RoboFleet Web

React UI built with Vite, TypeScript, TanStack Query, Hono's typed client, and Tailwind CSS 4.

## Development

From the repository root:

```sh
pnpm install
pnpm dev:robofleet
```

Configure the env files as described in `infra/README.md`. Docker must be running. The command
starts shared Postgres and Redis, builds messaging, and applies migrations before starting the apps.
The UI runs on `http://localhost:5173` and forwards `/api` to the Hono API on
`http://localhost:3000`. Set `ROBOFLEET_API_URL` to change the development or preview proxy
target. Ctrl+C stops the apps while leaving shared Postgres and Redis running.

## Fleet workspace

An icon rail provides placeholder Home, Robots, Time, Library, and Profile controls. Home
is visually active; navigation and profile actions are deferred.

The Robots panel sits beside a full-height isometric hotel map. Cards show status, current
location, destination, battery, and task details. Selecting a card highlights its robot on
the map; selecting a map robot reveals its card and clears any filter hiding it. Shared
selection and filtering live in URL query parameters through nuqs. Hover stays in Zustand.
On mobile, the map sits above a scrollable panel.
Hovering a card or map robot highlights both with a light primary outline; the selected robot keeps
its highlight after the pointer leaves. Hovering does not change selection or expand details.

The supplied hotel floor and robot renderer are retained in
`src/features/maps/components`, with provenance and original bundle notes in `SOURCE.md`.
The fixed-angle viewport supports cursor-centered wheel zoom, drag-to-pan, zoom/reset
buttons, and keyboard input: arrow keys pan, `+` / `-` zoom, and `0` resets.

Robot positions and remaining routes now come from persisted API telemetry. The map
viewBox, projection, destinations, and corridor graph live in Postgres and are read
through the map API. The existing hotel SVG remains a static visual asset. The UI
projects live coordinates into that asset without changing its proportions.

React Query owns fleet and map server state; one SSE connection updates the fleet
cache, ignores older generation/sequence values, and reconnects after failures. Components
subscribe through the `useRobots` and `useMaps` feature hooks, keeping query results as named
objects and using feature query options internally. The
stream sends a fresh snapshot on reconnect. Zustand owns hover; nuqs owns selection and filters.
The panel reports connection state and never substitutes a demo fleet during outages.
Battery and task values are formatted through query selectors; raw telemetry stays in the cache.

## Robot motion

The map animates independently of the one-second telemetry cadence. A local animation
loop predicts each working robot along its remaining corridor route using reported
speed and sample age. It follows corners, trims the route preview, and keeps selection
highlights attached to the displayed pose. Cards and the React Query cache update only
when server data changes.

Prediction stops after 1.5 seconds without a fresh sample. Repeated snapshots and hover
changes do not restart that clock. Small corrections settle over roughly 200 ms along
the corridor; an overshoot slows down longer to avoid reversing. Large corrections
(over 1.5 metres), producer restarts, and map changes reset immediately. Nonmoving
statuses stop prediction, and reduced-motion preferences show authoritative positions.
Map headings are converted to renderer camera yaw using the isometric ground projection,
so the robot’s front faces its direction of travel. These positions are display estimates;
persisted telemetry remains authoritative.

## Structure

- `src/features/maps/components`: hotel composition, robot map rendering, and the adapted pan/zoom viewport.
- `src/features/robots/stores/robots.store.ts`: transient robot hover, shared by cards and maps through selectors.
- `src/features/robots/hooks/use-selected-robot.ts`: selected robot in the `robot` query parameter.
- `src/features/robots/hooks/use-robot-filter.ts`: validated `all`, `active`, or `attention` filter in the `filter` query parameter.
- `src/features/robots/hooks/use-robots.ts`: the robot query hook, returning the complete React Query result.
- `src/features/maps/hooks/use-maps.ts`: the map query hook, returning the complete React Query result.
- `src/features/robots/components`: the fleet panel and expandable robot cards.
- `src/shared/components`: Navbar and shadcn/ui primitives, each in a PascalCase component folder.
- `src/features/robots/types/robot.ts`: robot presentation types.
- `src/features/robots/utils/needs-attention.ts`: robot attention filtering helper.
- `src/features/robots/hooks/use-robot-events.ts`: the single robot SSE subscription, mounted in `App`, and query cache updates.
- `src/features/robots/api/robots.events.ts`: Zod validation of snapshot and update payloads.
- `src/features/robots/api/robots.cache.ts`: generation/sequence-aware snapshot and update merging.
- `src/features/robots/utils/present-robot.ts`: query selectors for display formatting.
- `src/shared/hooks/use-event-listener.ts`: shared SSE connection lifecycle and reconnection.
- `src/test/fleet.json`: test-only fixtures, never loaded by the application.
- `src/test/setup.ts`: shared Vitest setup; unit tests stay beside their source.
- `e2e/features`: Playwright browser tests in `robots.spec.ts` and `maps.spec.ts`, with workflows grouped inside each feature spec.
- `e2e/fixtures.ts`: shared Playwright fixtures with REST/SSE route mocks, reusing `src/test/fleet.json`.
- `@repo/design-tokens`: shared shadcn variables, light/dark palettes, and Tailwind mappings.
- `src/shared/api`: the typed Hono client and shared health request.
- `src/features/robots/api`: robot requests and React Query options.
- `src/features/maps/api`: map requests and React Query options.
- `src/features/maps/hooks/use-robot-motion.ts`: predicted robot animation on the map.
- `src/features/maps/utils/robot-motion.ts`: motion calculations and colocated unit tests.
- `src/shared/utils/cn.ts`: shared class name utility.
- `src/shared/utils/parse-as-zod.ts`: shared nuqs parser adapter for Zod string schemas.

Each custom component has its own folder containing its implementation and a matching
`.spec.tsx` file. New component specs use `describe.todo` placeholders until tests are added.

URLs such as `/?robot=AMR-006&filter=attention` restore the selected robot and list filter.
Missing parameters mean no selection and all robots; an invalid filter also falls back to all.
Both URL state hooks use Zod schemas through `parseAsZod`. Robot IDs must contain 1–100 characters;
empty or oversized values are treated as no selection.
Collapsing a selected card removes `robot`, and choosing all robots removes `filter`.
Changes use browser history so Back/Forward restore earlier state. Selecting a map robot
updates selection and clears the filter together, preserving unrelated query parameters.

Tailwind uses the Vite plugin and `src/index.css`. The local component aliases are configured in
`components.json`, Vite, and TypeScript. The app uses the shadcn Nova/Base UI foundation
with the shared neutral palette. `src/index.css` imports
`@repo/design-tokens/tokens.css` and `@repo/design-tokens/tailwind.css` directly, adding green
success tokens for Working badges. Animations
come from `tw-animate-css`; `shadcn/tailwind.css` supplies Nova’s state/orientation variants. The default theme is light; adding `.dark` to `<html>` activates
the shared dark palette.

The Button follows the official shadcn Nova Base UI component with React 18 ref forwarding and the
existing local `cn` utility. Composition uses Base UI’s `render` prop. To add components,
run the official CLI from this app:

```sh
pnpm dlx shadcn@latest add @shadcn/<component>
```

The CLI targets `src/shared/components`. After adding a component, move its generated file into
a matching PascalCase folder (for example, `Button/Button.tsx`) and update its imports.
Reuse `@/shared/utils/cn` for `cn`,
and keep color/radius variables in the shared design-tokens package.

## Validation

Run these commands from `apps/robofleet-web`:

```sh
pnpm lint
pnpm check
pnpm test
```

`pnpm test:unit --run` runs Vitest with React Testing Library and jsdom. Unit tests live beside
the code as `*.spec.tsx` or `*.spec.ts` and cover fleet filtering, expandable details, and task/battery information.

`pnpm test:e2e` installs Chromium and runs Playwright against a production UI build and the
real API. Playwright starts its own servers on ports `4174` and `3031`, checks the same-origin
API health proxy, uses fixed REST/SSE fixtures, and covers fleet selection/filtering, keyboard/camera controls, linked map selection, mobile scrolling, shared light/dark themes, live event updates, stale events, backend failures, and reconnects. Browser tests live in `e2e/features/robots.spec.ts` and `e2e/features/maps.spec.ts`.

## Deployment

The UI’s Dockerfile, Compose service, and Caddyfile live in [infra/](infra/). The API owns
its [deployment files](../robofleet-api/infra/), including migrations. The
[root Compose file](../../infra/docker-compose.yml) combines all apps with shared services;
see the [infra README](../../infra/README.md) for deployment commands and public routing.
