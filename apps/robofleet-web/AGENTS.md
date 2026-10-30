# RoboFleet Web

## Folder Structure

- Group feature code under `src/features/<feature>/`, such as `robots` and `maps`.
- Put feature requests and React Query definitions in the feature's `api/` folder.
- Put feature components in the feature's `components/` folder.
- Put the shared API client and cross-feature requests in `src/shared/api/`.
- Put shared components, including shadcn primitives and Navbar, in `src/shared/components/`.
- Keep component folders directly under `components/`; do not add grouping folders such as `ui`, `layout`, or `illustrations`.
- Add feature `hooks/` folders when needed. Do not create empty folders or unused barrel exports.
- Keep feature hooks and utilities in that feature's `hooks/` and `utils/` folders; map motion belongs to `maps`.
- Put reusable cross-feature utilities in `src/shared/utils/`, such as `cn.ts`.
- Keep feature presentation types in that feature's `types/` folder, such as `features/robots/types/robot.ts`.
- Keep feature UI stores in that feature's `stores/` folder. Robot hover belongs to `features/robots/stores/robots.store.ts`, even when maps consume it.
- Keep shareable UI state in URL query parameters using nuqs, with a separate feature hook per parameter. Robot selection uses `use-selected-robot.ts` (`robot`) and filtering uses `use-robot-filter.ts` (`filter`); do not duplicate them in Zustand.
- Define string query parameter validation with Zod schemas through `src/shared/utils/parse-as-zod.ts`; keep defaults and history options in the feature hooks.
- Subscribe to Zustand stores through selectors for the fields a component needs. Keep server data in React Query rather than duplicating it in UI stores.

## Components

- Use a PascalCase folder and matching PascalCase implementation file for each component, including shadcn primitives: `Button/Button.tsx`.
- Give custom components a colocated matching spec: `RobotCard/RobotCard.spec.tsx`.
- Until a custom component has tests, use a `describe.todo("RobotCard")` placeholder instead of a completely empty spec, so Vitest can run.
- Keep component-specific helpers, renderer files, and their tests beside the component that owns them.
- Import components from their implementation files, such as `@/shared/components/Button/Button`.
- After adding a shadcn component, move generated files into this structure and update imports. Keep `components.json` aliases pointing to `@/shared/components`.

## API and React Query

- Use `<feature>.api.ts` for HTTP request functions and API types.
- Use `<feature>.queries.ts` for query keys and reusable `queryOptions` definitions.
- Always expose React Query reads through feature hooks in `hooks/`, such as `useRobots` and `useMaps`. Components must not call `useQuery` directly.
- Keep reusable `queryOptions` definitions in `api/` and consume them inside the feature hooks. Keep `useQueryClient` and query setup inside hooks rather than passing clients from components.
- Return the complete React Query result from query hooks. Keep that result as a named object, such as `const robotsQuery = useRobots()`, and access `robotsQuery.data`, `robotsQuery.isError`, and other fields directly. Do not destructure query result objects.
- Use `<feature>.mutations.ts` for mutation definitions when needed, and custom hooks for mutations with side effects.
- Keep HTTP request functions separate from React hooks and presentation formatting.

```tsx
const robotsQuery = useRobots();
const mapsQuery = useMaps();

const unavailable = robotsQuery.isError || mapsQuery.isError;
```

```text
src/
  features/
    robots/
      api/
        robots.api.ts
        robots.queries.ts
      hooks/
        use-robots.ts
      components/
        RobotCard/
          RobotCard.tsx
          RobotCard.spec.tsx
    maps/
      api/
        maps.api.ts
        maps.queries.ts
      components/
        HotelMap/
          HotelMap.tsx
          HotelMap.spec.tsx
      hooks/
        use-maps.ts
        use-robot-motion.ts
      utils/
        robot-motion.ts
        robot-motion.spec.ts
  shared/
    api/
      client.ts
      health.api.ts
    components/
      Button/
        Button.tsx
      Navbar/
        Navbar.tsx
        Navbar.spec.tsx
    utils/
      cn.ts
```

## Tests

- Keep unit specs beside their source files.
- Keep Playwright specs in `e2e/features/`, with one spec file per existing feature: `robots.spec.ts` and `maps.spec.ts`.
- Group related workflows inside each feature spec with `test.describe("Workflows")`; do not create separate workflow or shared spec files.
- Keep shared Playwright setup and REST/SSE route mocks in `e2e/fixtures.ts`. Feature specs must import `test` and `expect` from that fixture module so the mocks are applied consistently.
- Keep shared unit test setup and fixture data in `src/test/`; reuse that fixture data in browser tests.
