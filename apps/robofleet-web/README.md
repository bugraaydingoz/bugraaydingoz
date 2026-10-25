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
selection and filtering live in Zustand. On mobile, the map sits above a scrollable panel.
Hovering a card or map robot highlights both with a light primary outline; the selected robot keeps
its highlight after the pointer leaves. Hovering does not change selection or expand details.

The supplied hotel floor and robot renderer are retained in
`src/components/map/illustrations`, with provenance and original bundle notes in `SOURCE.md`.
The fixed-angle viewport supports cursor-centered wheel zoom, drag-to-pan, zoom/reset
buttons, and keyboard input: arrow keys pan, `+` / `-` zoom, and `0` resets.

Robot positions and remaining routes now come from persisted API telemetry. The map
viewBox, projection, destinations, and corridor graph live in Postgres and are read
through the map API. The existing hotel SVG remains a static visual asset. The UI
projects live coordinates into that asset without changing its proportions.

React Query owns fleet and map server state; one SSE connection updates the fleet
cache, ignores older generation/sequence values, and reconnects after failures. The
stream sends a fresh snapshot on reconnect. Zustand owns selection, hover, and filters.
The panel reports connection state and never substitutes a demo fleet during outages.
Battery and task values are formatted for display; numeric telemetry remains in the API.

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

- `src/components/map`: hotel composition and the adapted pan/zoom viewport.
- `src/stores/fleet.ts`: shared map/card selection and list filtering.
- `src/components/robots`: the fleet panel and expandable robot cards.
- `src/data/robots.ts`: presentation types and fleet filtering helpers.
- `src/hooks/use-fleet-data.tsx`: REST bootstrap, SSE subscription, reconnection and cache updates.
- `src/test/fleet.json`: test-only fixtures, never loaded by the application.
- `src/components/ui`: shadcn/ui components, with one file per component.
- `src/test/setup.ts`: shared Vitest setup; unit tests stay beside their source.
- `tests`: Playwright browser tests, kept flat.
- `@repo/design-tokens`: shared shadcn variables, light/dark palettes, and Tailwind mappings.
- `src/utils/api.ts`: the typed Hono client and request functions.
- `src/utils/utils.ts`: shared UI utilities.

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
the code as `*.spec.tsx` or `*.spec.ts` and cover fleet filtering, expandable details, and task/battery information.

`pnpm test:e2e` installs Chromium and runs Playwright against a production UI build and the
real API. Playwright starts its own servers on ports `4174` and `3031`, checks the same-origin
API health proxy, uses fixed REST/SSE fixtures, and covers fleet selection/filtering, keyboard/camera controls, linked map selection, mobile scrolling, shared light/dark themes, live event updates, stale events, backend failures, and reconnects. Browser tests live in `tests/*.spec.ts`.

## Deployment

Docker and Caddy configuration lives in `infra/`. See the repository's `infra/README.md` for
the Compose command and hostname routing. Both the UI and API have dedicated Dockerfiles.
