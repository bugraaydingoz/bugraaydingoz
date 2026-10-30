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
- Use `queryOptions` for reads by default. Add query hooks only when they provide meaningful behavior.
- Use `<feature>.mutations.ts` for mutation definitions when needed, and custom hooks for mutations with side effects.
- Keep HTTP request functions separate from React hooks and presentation formatting.

```text
src/
  features/
    robots/
      api/
        robots.api.ts
        robots.queries.ts
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
- Keep Playwright tests directly in `tests/`, without an `e2e/` subfolder.
- Keep shared test setup and fixtures in `src/test/`.
