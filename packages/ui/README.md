# @moritzbrantner/ui

Shared Tailwind 4 React UI primitives, layout components, and global theme styles for the platform packages workspace.

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

## Theme Metadata

`UiTheme`, `BobbaTheme`, and `ZleekTheme` add theme metadata classes and `data-ui-theme` attributes around a subtree. They do not scope CSS tokens by themselves; the active visual theme still comes from the single stylesheet imported by the app.

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
```

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
