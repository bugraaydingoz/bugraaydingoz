# RoboFleet map architecture decision

- Date: 2026-10-31
- Status: Accepted direction; implementation pending
- Affected apps: `robofleet-web`, `robofleet-api`

## Context

The current dashboard renders a static hotel SVG and detailed robot SVGs. Robot motion updates React state on animation frames, and heading changes regenerate robot artwork. This approach adds substantial DOM and CPU work as the fleet grows.

The product direction includes a robot simulator and a building editor. The map therefore needs reusable environment geometry, continuous robot rotation, selectable entities, and data that can be edited independently of rendering.

## Decision

Use Three.js through React Three Fiber to render a procedural warehouse. Adopt the supplied screenshot's dark operational-map style while preserving the existing robot's shape and proportions.

Replace the hotel layout and navigation graph with a warehouse layout. Keep building definitions independent of Three.js so the same document can support the viewer, a future editor, and simulation geometry.

Implement the migration through small, focused patches. Each patch must leave the application runnable and be suitable for individual code review.

## Visual direction

| Element | Direction |
| --- | --- |
| Ground | Dark charcoal floor with subtle grid and aisle markings |
| Structures | Low blue walls, cyan edges, and selective translucent panels |
| Warehouse content | Repeated rack rows, aisle intersections, staging areas, loading bays, and charging stations |
| Routes | Bright green dashed paths or animated chevrons and destination markers |
| Robots | Existing monowheel, rounded body, arms, faceplate, and antenna |
| Selection | Ground rings, heading indicators, and restrained status accents |
| Labels | Selective robot, room, zone, and station labels |
| Camera | Orthographic angled view with pan, zoom, reset, and optional bounded rotation |

The screenshot is a style reference, not a requirement to reproduce its exact geometry or forklift models. Start with emissive colors; add glow or other postprocessing only after profiling. Prefer low walls to preserve robot visibility and limit transparency-ordering problems.

## Data and ownership

### Building document

Define a serializable, renderer-independent building contract with explicit schema versioning and stable entity IDs. Start with the entities needed for the warehouse:

- Rooms and zones represented by polygons.
- Structural wall segments with thickness and height.
- Door openings referencing their host wall by ID and position along that wall.
- Obstacles and fixtures with explicit footprints and collision semantics.
- Stations with IDs, locations, and semantic kinds such as charging or loading.

Rooms and zones describe semantic areas. Walls are explicit structural entities; do not generate a separate wall for every room boundary, which would duplicate shared walls and complicate door editing.

Store new building geometry in metres. The new warehouse uses `metresPerUnit: 1`. Preserve the existing telemetry contract and convert legacy map coordinates to metres at one rendering boundary. Document axis, origin, elevation, and heading conventions, including the mapping from API X/Y to Three.js X/Z.

Initially expose the building definition as an optional field on the existing map contract so legacy hotel data remains valid. Reuse the API's schema-derived types instead of defining competing frontend domain contracts.

### Renderer

The renderer receives building data, selection IDs, and interaction callbacks. It generates meshes from that input. Mesh positions and Three.js objects must never become the authoritative building document.

Building primitives emit entity IDs and world-space hit positions. They do not fetch server data, update URL parameters, or access fleet stores directly. Camera state, materials, labels, and selection styling remain presentation concerns.

Keep geometry creation separate from component lifecycle where practical. Reuse geometry and materials, update changed entities by stable ID, and dispose of replaced GPU resources.

### Fleet integration

Keep authoritative fleet and map data in React Query. Keep robot selection and filtering in the existing nuqs hooks, and hover state in the existing robot store.

Reuse motion reconciliation and evaluation, including generation, sequence, stale-data, and reduced-motion behavior. Evaluate motion in a shared frame loop and update transforms or instance matrices directly. Transient display poses belong to the renderer's motion models rather than a second server-data store.

### Future building editor

The future editor owns a draft building document, tools, snapping, validation, and undo/redo. It can render the draft through the same building components and translate interaction callbacks into document changes.

Do not introduce editor tools, a generic command framework, or draft persistence in this migration. Establish data ownership and interaction boundaries now so those features can be added without replacing the renderer.

### Navigation and simulation

Keep the navigation graph separate from visual geometry. Validate it against the relevant building/map revision so routes cannot silently continue through newly edited walls or obstacles.

The existing route-following simulator continues producing telemetry. A future simulation engine owns timing, movement rules, collision behavior, and robot dynamics. Three.js displays the resulting state.

Decorative structures do not automatically become colliders. Collision geometry must follow explicit building semantics. Physics, traffic coordination, sensor simulation, and automatic navigation generation are separate future work.

## Robot graphics reuse

Port the procedural dimensions, profiles, colors, and component placement from `apps/robofleet-web/src/features/maps/components/Robot/robot-renderer.js` into reusable mesh geometry.

Translate rounded extrusions, cylinders, rods, and surface panels into meshes. Preserve the robot silhouette before tuning materials and outlines. The first visual checkpoint compares one mesh robot with the SVG reference at several headings, including its wheel contact point and turning direction.

Exact reproduction of view-dependent SVG strokes is not guaranteed. Tune outlines and shading to retain the robot's identity within the new warehouse style. Preserve existing source attribution.

## Repository structure

Follow the existing feature organization rather than introducing a parallel `features/map` tree:

- API building schemas and types under `apps/robofleet-api/src/maps/`, referenced by `src/contracts.ts`.
- Rendering components under `apps/robofleet-web/src/features/maps/components/`, each in a matching PascalCase folder with a colocated spec.
- Motion and integration hooks under the existing maps `hooks/` folder.
- Coordinate conversion and other pure feature utilities under maps `utils/`.
- Frontend presentation types under maps `types/`.
- Component-specific geometry and renderer helpers beside the owning component.

Planned component responsibilities include `MapScene`, `Room`, `Wall`, `Door`, warehouse fixtures, `Robot`, `RobotInstances`, `RobotPath`, and `MapControls`. Add components as their implementation requires them; avoid empty scaffolding.

Use a Three.js, React Three Fiber, and Drei dependency combination compatible with React 19. Upgrade the app to React 19 in a separate prerequisite patch before introducing the renderer.

## Implementation sequence

| Patch | Scope | Review outcome |
| --- | --- | --- |
| 1 | Building schema and validation tests; optional building field on map contract | Domain model can be reviewed without rendering, dependencies, or database changes |
| 2 | Coordinate, heading, and unit adapters | Geometry, telemetry, routes, and future pointer tools share tested conventions |
| 3 | Three.js/R3F foundation and camera controls | Small preview scene supports pan, zoom, reset, resize, and rendering failures |
| 4 | Data-driven warehouse primitives | One representative warehouse section matches the visual direction and supports entity picking |
| 5 | Robot geometry port | Existing robot shape is recognizable and correct from several headings |
| 6 | Instanced fleet rendering and motion integration | Live robots, routes, selection, and hover work without per-frame React state updates |
| 7 | Complete warehouse data, navigation graph, and simulator migration | Robots start at valid locations and navigate the warehouse |
| 8 | Default-view cutover, performance validation, and SVG cleanup | Warehouse replaces the hotel after behavior and scale checks pass |

Keep existing functionality active until the corresponding replacement is ready. Separate changes by app when practical. Do not modify unrelated work in progress.

The first patch is limited to the building contract, optional map-contract integration, and validation tests. It adds no Three.js dependencies and makes no database or visual changes.

## Warehouse rollout

Add a new database migration instead of modifying an applied migration. Create the warehouse map and its graph, then update seeded robot profiles, initial positions, destinations, and routes consistently.

Handle persisted robot state that still references the hotel. Reset or migrate its coordinates and route together with the map reference; do not relabel hotel coordinates as warehouse coordinates. Preserve generation and sequence correctness during the transition.

Resolve the exact map ID and version referenced by telemetry, including historical lookup where needed. Never place robots against an unrelated fallback layout.

## Performance and verification

Use shared geometry/materials and instanced meshes for repeated robot parts and warehouse structures. Resolve picked instances back to stable entity IDs. Limit detailed labels, routes, outlines, and effects according to selection and viewing distance.

Render on demand when motion and controls settle. Bound device pixel ratio and expensive effects. Profile SSE cache updates and sidebar rendering alongside the canvas; add update coalescing or list virtualization in separate focused patches if measurements justify them.

Validate:

- Finite coordinates, valid polygons and dimensions, unique IDs, valid references, and door openings within host walls.
- Coordinate round trips, heading directions, and consistent units across geometry, routes, and robots.
- Camera controls, pointer picking, selection/hover synchronization, keyboard access, and drag-versus-click behavior.
- Map versions, stale telemetry, reduced motion, resizing, and unavailable WebGL.
- Navigation connectivity, reachable destinations, robot clearance, and routes through open space.
- Robot appearance at multiple headings and warehouse appearance at representative zoom levels.

Keep pure geometry and motion checks in unit tests. Use Playwright for actual WebGL rendering and interaction rather than relying on jsdom to validate graphics. Update existing SVG-specific assertions to verify the replacement's observable behavior.

Benchmark 100, 500, 1,000, and 5,000 robots, recording frame time, input responsiveness, draw calls, and memory on documented hardware. Establish the supported fleet size from measurements rather than assuming GPU rendering guarantees it.

Before commits, run `pnpm lint` and `pnpm test` in affected apps only, plus relevant type checks and builds.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| Optimize existing SVG | Smaller migration, but retains DOM costs and does not supply reusable 3D environment geometry |
| Canvas 2D or Konva | Suitable for a focused 2D viewer; requires additional work for changing viewpoints and spatial simulation visuals |
| PixiJS sprites | Strong fit for preserving a fixed-angle illustrated view; robot headings and camera angles require prerendered artwork |
| Three.js with procedural geometry | Chosen for continuous rotation, shared spatial geometry, flexible cameras, and future editor/simulator integration |
| AI-generated or manually modeled assets | Optional later; existing procedural robot geometry and repeated warehouse structures can be reused or generated directly |

## Consequences and remaining details

The migration introduces GPU resource management, picking, camera behavior, and visual regression work. Matching the robot's outline style and maintaining performance with labels and transparency require measurement and tuning.

The exact warehouse dimensions, rack arrangement, station placement, camera limits, and supported-device performance targets will be settled during the representative-scene and layout patches. The screenshot defines the style, not authoritative warehouse measurements.

Editor saving, publishing, permissions, collaboration, undo history, physical robot dynamics, and traffic coordination are outside the initial migration.
