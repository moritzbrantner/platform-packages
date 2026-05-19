# Design system

`@moritzbrantner/ui` is the low-level design-system package consumed by this workspace. It now lives in the standalone `moritzbrantner/ui` repository and owns shared tokens, React primitives, composed UI components, theme metadata, Storybook coverage, and package-consumption guarantees.

`@moritzbrantner/frontend-ui` is intentionally higher level. It may compose `@moritzbrantner/ui` with pages, auth/session state, roles, profiles, settings, admin surfaces, navigation models, and other product workflows, but those workflows should not move into `@moritzbrantner/ui`.

## Layers

The package is maintained in four layers:

1. Tokens: CSS variables for color, typography, radius, spacing, shadows, motion, z-index, focus rings, and chart colors.
2. Primitives: reusable controls such as `Button`, `Input`, `Checkbox`, `Select`, `Dialog`, `Popover`, `Tooltip`, and `Tabs`.
3. Composed components: shared arrangements such as `Card`, `DataTable`, `PlatformNavbar`, `PageShell`, `Toolbar`, `Stepper`, and `Dropzone`.
4. Product patterns: app shell, auth, settings, admin/account/profile pages, role-aware navigation, and complete frontend flows. These belong in product packages such as `frontend-ui`, not in `ui`.

Generic visual affordances such as `AccountMenu` and `NotificationMenu` may live in `@moritzbrantner/ui` when they are state-free and contract-free. App-specific menu content, routing, auth/session state, and backend behavior belong in `@moritzbrantner/frontend-ui` or consuming applications.

## Consumer contract

Apps import exactly one global UI stylesheet:

```tsx
import "@moritzbrantner/ui/styles.css";
```

Apps that need multiple UI themes on one page can instead import the scoped theme stylesheet:

```tsx
import "@moritzbrantner/ui/theme-scopes.css";
```

The package also exposes theme-specific stylesheets:

```tsx
import "@moritzbrantner/ui/zleek/styles.css";
import "@moritzbrantner/ui/bobba/styles.css";
import "@moritzbrantner/ui/atlas/styles.css";
import "@moritzbrantner/ui/studio/styles.css";
import "@moritzbrantner/ui/paper/styles.css";
```

Use root component imports by default:

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";
```

Narrow imports are available for package consumers that need them:

```tsx
import { Button } from "@moritzbrantner/ui/components/button";
import { cn } from "@moritzbrantner/ui/lib/cn";
```

## Component contract

Public components should:

- Accept `className`.
- Forward normal DOM props.
- Use `data-slot` for stable styling and testing hooks.
- Use variants for intentional design choices.
- Prefer `asChild` for polymorphic composition when the underlying primitive supports it.
- Export variant helpers only when downstream consumers need them.
- Avoid product-specific business logic.
- Avoid open-ended visual props such as `color`, `rounded`, `shadow`, or arbitrary spacing controls.

Good:

```tsx
<Button variant="secondary" size="sm">
  Save
</Button>
```

Avoid:

```tsx
<Button color="blue" rounded="large" shadow="heavy" padding="wide" />
```

## Token strategy

Tokens are semantic CSS custom properties exported from `@moritzbrantner/ui/styles.css`. Public component styling should use tokens such as `--primary`, `--muted`, `--border`, and `--ring`, not raw color names.

Theme wrappers such as `UiTheme`, `BobbaTheme`, `ZleekTheme`, `AtlasTheme`, `StudioTheme`, and `PaperTheme` add metadata classes and `data-ui-theme` attributes. With `@moritzbrantner/ui/theme-scopes.css`, those wrappers also scope the built-in theme variables so multiple visual themes can coexist in one document. With the global theme stylesheets, use one UI theme per app.

Consumers can tune supported theme values with the typed `createUiTheme` helper:

```tsx
import { UiTheme, createUiTheme } from "@moritzbrantner/ui";

<UiTheme
  theme="custom"
  style={createUiTheme({
    "--primary": "oklch(0.58 0.17 250)",
    "--ui-radius-control": "0.75rem",
    "--ui-control-height-md": "2.5rem",
  })}
>
  <App />
</UiTheme>;
```

The current visual systems are:

- `bobba`: the default package style.
- `zleek`: a sharper glass-styled package style.
- `atlas`: a dense dashboard and data style for maps, tables, charts, and analytics.
- `studio`: a creative tooling style for media, storytelling, image, and video workflows.
- `paper`: a document and research style for OCR, reading, translation, linguistics, and text-heavy tools.

## Adding components

Add a component to `@moritzbrantner/ui` only when it is a fundamental primitive or is needed by at least two projects.

Every new public component must have:

- A root export from `src/index.ts`.
- A component subpath from the generated `tsup` entry map.
- Storybook coverage so the component appears in Storybook.
- A dedicated `*.stories.tsx` entry when the component should be directly discoverable on its own, not only through an aggregate catalog.
- Tests for important rendering, accessibility, and variant behavior.
- Styling based on existing tokens.

## Verification

Before publishing `@moritzbrantner/ui`, run:

```sh
bun run --filter @moritzbrantner/ui check-types
bun run --filter @moritzbrantner/ui lint
bun run --filter @moritzbrantner/ui test
bun run --filter @moritzbrantner/ui build
bun run --filter @moritzbrantner/ui test:storybook
bun run --filter @moritzbrantner/ui test:package
cd ../ui && npm pack --dry-run --ignore-scripts --json
```

`bun run --filter @moritzbrantner/ui lint` includes a design-system verifier that checks package exports, stylesheet exports, component root exports, Storybook coverage, and the consumer example.
