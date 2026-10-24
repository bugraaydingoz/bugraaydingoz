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

Robot positions and doorway routes use the supplied 1400 × 950 SVG projection. Map and robot
overlays share the same viewBox and camera transform, keeping their alignment during zoom,
pan, and resizing. Edit `src/data/hotel.ts` for floor-plan positions and destination doors.
The scene is one decorative floor with stationary demo robots; routes are preview paths
through the corridor, and furniture occlusion/navigation simulation are future work.

The fleet is **demo data**, labeled in the panel footer. The panel does not fetch telemetry
or claim a live connection. Replace `src/data/robots.ts` when the simulator and API are ready.

## Structure

- `src/components/map`: hotel composition and the adapted pan/zoom viewport.
- `src/stores/fleet.ts`: shared map/card selection and list filtering.
- `src/components/robots`: the fleet panel and expandable robot cards.
- `src/data/robots.ts`: demo fleet fixtures; telemetry integration is deferred.
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
API proxy, fleet selection/filtering, keyboard/camera controls, linked map selection, mobile scrolling, and shared light/dark themes. Browser tests live in `tests/*.spec.ts`.

## Deployment

Docker and Caddy configuration lives in `infra/`. See the repository's `infra/README.md` for
the Compose command and hostname routing. Both the UI and API have dedicated Dockerfiles.
