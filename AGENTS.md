# AGENTS

## Tech Stack

- TypeScript with pnpm.
- Follow existing project conventions and patterns.

## Shared Redis

- Namespace Redis resources by app. Keys, queue keys, channels, and locks must start with the app name, e.g. `robofleet:telemetry:…`.
- For BullMQ, use the app name as the queue prefix, e.g. `prefix: "robofleet"` with queue name `telemetry`.
- Do not prepend library names such as `bull` or environment names such as `production` or `prod`.
- Keep operations scoped to the app's namespace; Redis is shared with other apps.

## Validation

- Before committing, run pnpm lint and pnpm test in the affected apps or packages only.

## Commit Convention

- Format: `(<app>) <description>`, e.g. `(web) Fix dark mode toggle`.
- Use the app/package name from the codebase. Omit the prefix for root changes.
- Start descriptions with a capital letter, use imperative mood, and omit trailing periods.
- Keep commits focused on one logical change. Separate changes by app when possible.
- Follow existing conventions in `git log --oneline` when unsure.
