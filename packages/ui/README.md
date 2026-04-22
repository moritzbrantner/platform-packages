# @moritzbrantner/ui

Shared Tailwind 4 React UI primitives, layout components, and global theme styles for the platform packages workspace.

## Design System Role

`@moritzbrantner/ui` is the low-level design-system package. It owns shared tokens, primitives, composed components, theme metadata, Storybook coverage, and package-consumption guarantees.

Keep product workflows in higher-level packages such as `@moritzbrantner/foundation-ui`. Auth, profiles, uploads, settings, report-problem flows, and other app-specific behavior should compose `@moritzbrantner/ui` instead of living in it.

## Install

```sh
bun add @moritzbrantner/ui
```

The package is published to GitHub Packages for the `@moritzbrantner` scope, so consumers need registry access configured for that scope.

## Styles

Import exactly one UI stylesheet for the app. Theme tokens are global CSS custom properties, so different UI themes are not intended to coexist on the same page.

```ts
import "@moritzbrantner/ui/styles.css";
```

Use Zleek globally when the app should use the glass-styled theme:

```ts
import "@moritzbrantner/ui/zleek/styles.css";
```

The Bobba subpath is an alias for the default stylesheet:

```ts
import "@moritzbrantner/ui/bobba/styles.css";
```

Additional visual systems are available for specific product surfaces:

```ts
import "@moritzbrantner/ui/atlas/styles.css";
import "@moritzbrantner/ui/studio/styles.css";
import "@moritzbrantner/ui/paper/styles.css";
```

Use `atlas` for dense dashboards and analytics, `studio` for creative tooling, and `paper` for document or research-heavy interfaces.

## Components

Root imports are the stable default for application code:

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Package status</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Refresh</Button>
      </CardContent>
    </Card>
  );
}
```

Component subpaths are available for package consumers that prefer narrower imports:

```tsx
import { Button } from "@moritzbrantner/ui/components/button";
import { cn } from "@moritzbrantner/ui/lib/cn";
```

## Component Contract

Public components should accept `className`, forward standard DOM props, expose stable `data-slot` hooks, and use variants for intentional design choices. Avoid arbitrary visual props such as `color`, `rounded`, `shadow`, or custom spacing knobs; those decisions should come from design tokens and named variants.

```tsx
<Button variant="secondary" size="sm">
  Save
</Button>
```

## Theme Metadata

`UiTheme`, `BobbaTheme`, `ZleekTheme`, `AtlasTheme`, `StudioTheme`, and `PaperTheme` add theme metadata classes and `data-ui-theme` attributes around a subtree. They do not scope CSS tokens by themselves; the active visual theme still comes from the single stylesheet imported by the app.

```tsx
import { UiTheme, type UiThemeName } from "@moritzbrantner/ui";

export function Shell({ theme }: { theme: UiThemeName }) {
  return (
    <UiTheme theme={theme} className="contents">
      <main>Application content</main>
    </UiTheme>
  );
}
```

Theme metadata is also available from subpaths:

```ts
import { themeConfig } from "@moritzbrantner/ui/themes";
import { uiTheme as zleekTheme } from "@moritzbrantner/ui/zleek";
import { uiTheme as bobbaTheme } from "@moritzbrantner/ui/bobba";
import { uiTheme as atlasTheme } from "@moritzbrantner/ui/atlas";
import { uiTheme as studioTheme } from "@moritzbrantner/ui/studio";
import { uiTheme as paperTheme } from "@moritzbrantner/ui/paper";
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [../../docs/design-system.md](../../docs/design-system.md) for package boundaries, component requirements, and release checks.

## Release Checks

Before publishing, run:

```sh
bun run --filter @moritzbrantner/ui check-types
bun run --filter @moritzbrantner/ui lint
bun run --filter @moritzbrantner/ui test
bun run --filter @moritzbrantner/ui build
bun run --filter @moritzbrantner/ui test:storybook
bun run --filter @moritzbrantner/ui test:package
cd packages/ui && npm pack --dry-run --ignore-scripts --json
```
