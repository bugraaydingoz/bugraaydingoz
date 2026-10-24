# Design tokens

`@repo/design-tokens` shares shadcn CSS variables across apps without a runtime dependency or build step. The default is shadcn's neutral light theme; `.dark` uses the palette from `bugraaydingoz-web`, including its grayscale charts and `0.625rem` radius.

Add `"@repo/design-tokens": "workspace:*"` to an app's dependencies, then run `pnpm install` from the workspace root.

## Plain CSS

Import through the app's CSS bundler:

```css
@import "@repo/design-tokens/tokens.css";

.panel {
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
```

Astro apps can also import `@repo/design-tokens/tokens.css` in a layout's frontmatter. Unbundled pages can serve `tokens.css` directly through a stylesheet link.

## Tailwind CSS v4 and shadcn

```css
@import "tailwindcss";
@import "@repo/design-tokens/tokens.css";
@import "@repo/design-tokens/tailwind.css";
```

Use utilities such as `bg-background`, `text-foreground`, `border-border`, and `rounded-lg`. The adapter maps all shared colors and the shadcn radius scale, and makes `dark:` variants follow the `.dark` class. Keep `tailwind.cssVariables: true` in the app's `components.json`.

## Themes and overrides

Add `class="dark"` to `<html>` for the personal site's appearance. Without it, the theme is light. Theme selection and system preference handling belong to the app.

Override tokens after the imports to customize an app:

```css
:root {
  --radius: 0.75rem;
}

.dark {
  --primary: oklch(0.87 0 0);
}
```

The package provides colors and radii only. Fonts, resets, base element styles, animations, and app-specific tokens stay in each app.

References: [shadcn theming](https://ui.shadcn.com/docs/theming), [Tailwind theme variables](https://tailwindcss.com/docs/theme).
