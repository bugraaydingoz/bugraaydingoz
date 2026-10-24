# AGENTS

- Tech stack: TypeScript with pnpm
- Before committing, run `pnpm lint` and `pnpm test` in the corresponding apps. Don't run it for all.

## Commit Convention

- Format: `(<app name>) <short description>`
  - Example: `(api) fix pagination on users endpoint`
  - Example: `(web) add dark mode toggle to settings`
- `<app name>` is the app/package the change belongs to (e.g. `api`, `web`, `cli`, `core`). Use the name used in the codebase's app/package structure.
- Keep the short description in imperative mood, lowercase, without a trailing period.
- One commit covers one logical change in one app. Changes spanning multiple apps are committed separately per app.
- If unsure which app name to use, check the recent commit history (`git log --oneline`) and match the existing style.
