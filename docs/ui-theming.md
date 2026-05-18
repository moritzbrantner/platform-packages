# UI theming

`@moritzbrantner/ui` is adjusted through semantic CSS custom properties. Prefer tokens and intentional variants over component props such as `color`, `rounded`, `shadow`, or arbitrary padding controls.

## Imports

Use the default package style when an app has one visual system:

```tsx
import "@moritzbrantner/ui/styles.css";
```

Use a global built-in theme when the whole app should adopt that visual system:

```tsx
import "@moritzbrantner/ui/atlas/styles.css";
```

Use scoped themes when previews, embedded widgets, or mixed-brand pages need more than one visual system in the same document:

```tsx
import "@moritzbrantner/ui/theme-scopes.css";
```

```tsx
import { AtlasTheme, PaperTheme } from "@moritzbrantner/ui";

<AtlasTheme>
  <Dashboard />
</AtlasTheme>
<PaperTheme>
  <ResearchPanel />
</PaperTheme>
```

## Custom Themes

Use `createUiTheme` for supported inline token overrides. Unknown token names are dropped at runtime.

```tsx
import { UiTheme, createUiTheme } from "@moritzbrantner/ui";

const theme = createUiTheme({
  "--primary": "oklch(0.58 0.17 250)",
  "--primary-foreground": "oklch(0.99 0.01 250)",
  "--ui-radius-control": "0.75rem",
  "--ui-radius-surface": "1rem",
  "--ui-control-height-md": "2.5rem",
  "--ui-surface-padding-md": "1.25rem",
});

<UiTheme theme="custom" style={theme}>
  <App />
</UiTheme>;
```

## Stable Token Groups

Color tokens:

```css
--background;
--foreground;
--card;
--card-foreground;
--popover;
--popover-foreground;
--primary;
--primary-foreground;
--secondary;
--secondary-foreground;
--muted;
--muted-foreground;
--accent;
--accent-foreground;
--destructive;
--border;
--input;
--ring;
```

Shape, spacing, motion, and shadow tokens:

```css
--ui-radius-control;
--ui-radius-surface;
--ui-radius-overlay;
--ui-control-height-xs;
--ui-control-height-sm;
--ui-control-height-md;
--ui-control-height-lg;
--ui-control-padding-x-sm;
--ui-control-padding-x-md;
--ui-control-gap;
--ui-surface-padding-sm;
--ui-surface-padding-md;
--ui-surface-gap;
--ui-focus-ring-width;
--ui-motion-hover-y;
--ui-motion-hover-scale;
--ui-shadow-surface;
--ui-shadow-interactive;
```

Component-specific tokens such as `--ui-button-height-md`, `--ui-input-radius`, and `--ui-card-padding` are stable when a site needs to tune one component family without changing the global control or surface scale.

## Examples

Compact dashboard:

```css
.dashboard-theme {
  --ui-control-height-md: 2.125rem;
  --ui-control-padding-x-md: 0.875rem;
  --ui-control-gap: 0.375rem;
  --ui-surface-padding-md: 0.875rem;
  --ui-surface-gap: 0.75rem;
  --ui-motion-hover-scale: 1.035;
}
```

Rounded marketing site:

```css
.marketing-theme {
  --ui-radius-control: 999px;
  --ui-radius-surface: 1.25rem;
  --ui-radius-overlay: 1.5rem;
  --ui-control-height-md: 2.625rem;
  --ui-surface-padding-md: 1.25rem;
}
```

Sharp editorial site:

```css
.editorial-theme {
  --ui-radius-control: 0.125rem;
  --ui-radius-surface: 0.25rem;
  --ui-motion-hover-scale: 1.01;
  --ui-shadow-surface: 0 4px 14px oklch(0.2 0.02 80 / 0.08);
}
```

## Internal Values

Do not depend on generated Tailwind utility classes, Radix internal CSS variables, or private component layout details. Treat the documented semantic tokens and exported TypeScript theme helpers as the public theming API.
