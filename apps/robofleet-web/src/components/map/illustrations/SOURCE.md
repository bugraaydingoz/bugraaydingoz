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

`color`: six-digit hex. `heading`: degrees on the ground plane (0 right, 90 away, 180 left, 270 toward the viewer). `wheelAngle`: radians. `size`: SVG width in pixels. Also accepts `label`, `className`, and `style`.

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

`HotelFloor` adds an independent hotel map layer with ten guest rooms, reception, kitchen, lounge, and dining. Place it inside a relative container with a set height. It uses a 1400 × 950 SVG viewBox, with a 2160 × 660 (x runs from -360 to 1800) floor plan; `projectHotelPoint(x,y,z)` converts plan coordinates to viewBox points. When positioning overlays, also apply the SVG's centered `meet` scaling and offset. Anchor a robot at its wheel contact (120,178 in its 260 × 235 viewBox).

The standalone HTML demo demonstrates corridor/doorway routes. `RobotFleet` remains the earlier free-roaming demo; map routing and furniture occlusion are not built into that React component. The map is currently one decorative floor, ready for styling review before adding floor switching.

## Fixed-angle zoom and pan

```tsx
import { MapViewport, HotelFloor } from "./robot";
<MapViewport style={{ height: 800 }}>
  <HotelFloor />
</MapViewport>;
```

Scroll to zoom at the cursor, drag empty space to pan, or use the zoom/reset buttons. The camera cannot rotate. Put map and robot overlays inside the same viewport. Mark selectable overlays with `data-map-interactive` so pressing them does not pan the map. `RobotFleet` already marks its robot overlays this way.
