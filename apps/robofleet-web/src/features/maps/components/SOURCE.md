# Supplied illustration components

HotelFloor, Robot, and the robot renderer were supplied by the user as the Colorfigures
robot component bundle. The geometry, colors, and original renderer attribution are retained.
The app adapts sizing/accessibility and provides its own fleet placement and map controls.

The supplied free-roaming RobotFleet demo is independent of the hotel floor plan. This app
uses the standalone Robot with explicit floor-plan coordinates and stationary preview data.

## Original bundle notes

# Colorfigures robot components

Copy this folder into your React + TypeScript app. Requires React 18 or 19. No other runtime dependencies, CSS imports, network requests, or assets are needed.

```tsx
import { Robot, RobotFleet } from './robot';

// A robot driven by your fleet telemetry:
<Robot color="#79bca0" heading={60} wheelAngle={0.5} size={200} />

// Demo fleet with automatic roaming and selection:
<div style={{ height: 700 }}>
  <RobotFleet onSelect={robot => console.log(robot)} />
</div>
```

## Robot

`color`: six-digit hex. `heading`: degrees in map coordinates (0 = +X, 90 = +Y, 180 = -X, 270 = -Y). The app converts this to renderer camera yaw using the map projection so the robot faces along its route. `groundRatio` is the map projection’s Y/X scale ratio (default 0.5). `wheelAngle`: radians. `size`: SVG width in pixels. Also accepts `label`, `className`, and `style`.

Geometry is modeled in 3D and projected into SVG. Changing heading recomputes visible faces, shading, and depth ordering; it does not rotate a flat image. The oval contact shadow stays on the ground. There is no dust.

## RobotFleet

`initialRobots`: array of unique `{ id, color, x, y, heading? }` entries. Positions are normalized center coordinates, 0–1. Changes to this initial prop do not reset a mounted fleet; use React `key` to reset it. `roaming` defaults to true; set false to disable autonomous movement. `robotSize` defaults to 240. `style` and `className` style the container.

`onSelect` receives the selected robot or null when deselected. Click, tap, or use Enter/Space to select. Selection displays a live route line and destination marker while the robot continues moving. Robots cannot be repositioned with dragging or arrow keys. Positions and selection are not persisted automatically.

Reduced-motion preferences stop autonomous roaming. Animation frames and ResizeObserver are cleaned up on unmount.

For a production telemetry UI, use the standalone `Robot` and let your own layout or map position it. The included fleet is an uncontrolled demo scene, without navigation or collision avoidance. Its robots can overlap.

## Files

- `Robot.tsx`: presentation component, memoized SVG rendering.
- `RobotFleet.tsx`: optional demo behavior and positioning.
- `robot-renderer.js` and `.d.ts`: self-contained renderer with types. Keep both.
- `index.ts`: public exports.

Drawing primitives adapted from the supplied Colorfigures skill. Preserve any upstream attribution or license requirements that apply to your distribution.

## Hotel floor styling study

`HotelFloor` was updated from the user's `robot 2` bundle. The supplied SVG geometry
and projection are retained: a 2200 × 2200 square hotel in a 1400 × 1000 viewBox,
twelve guest rooms (three per side), a central garden, reception, kitchen, dining,
and robot service. The persisted projection converts plan coordinates to viewBox
points. Anchor robots at wheel contact (120,178 in their 260 × 235 viewBox).

The supplied layout is seeded into Postgres by the API migration, including the
16-node corridor ring, doorway entries, and corner vestibule waypoints. The simulator
reads that graph and the UI renders its persisted positions and remaining routes.
Robot SVGs keep their aspect ratio and world scale under the new floor projection.
Furniture occlusion and navigation simulation remain future work.

## Fixed-angle zoom and pan

```tsx
import { MapViewport, HotelFloor } from "./robot";
<MapViewport style={{ height: 800 }}>
  <HotelFloor />
</MapViewport>;
```

Scroll to zoom at the cursor, drag empty space to pan, or use the zoom/reset buttons. The camera cannot rotate. Put map and robot overlays inside the same viewport. Mark selectable overlays with `data-map-interactive` so pressing them does not pan the map. `RobotFleet` already marks its robot overlays this way.
