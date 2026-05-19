# @moritzbrantner/frontend-ui

Workflow-level React screen templates that compose `@moritzbrantner/ui` into
repeatable product surfaces.

This package is intentionally above the design system. It can express page
structure, workflow routes, auth/session placeholders, account/profile/settings
screens, and Storybook scenarios. It should not own primitive components,
tokens, or low-level interaction patterns; those stay in `@moritzbrantner/ui`.

## Public API

- `PublicScreen`
- `FormScreen`
- `DashboardScreen`
- `DetailScreen`
- `WorkbenchScreen`
- `FrontendScreenSection`
- `WorkflowRoute`
- `WorkflowSessionState`
- `WorkflowAppState`
- `WorkflowActions`
- `WorkflowScenario`

## Screen templates

Each screen accepts a shared header contract plus repeated `sections`, optional
actions, and optional sidebars. The package leaves data fetching, routing,
authorization, and persistence to the consuming app.

```tsx
import { Button } from "@moritzbrantner/ui";
import { DashboardScreen } from "@moritzbrantner/frontend-ui";

export function HomeScreen() {
  return (
    <DashboardScreen
      title="Home"
      description="Operational overview"
      primaryAction={<Button>New item</Button>}
      sections={[
        {
          id: "queue",
          title: "Queue",
          content: <p>12 items need review.</p>,
        },
      ]}
    />
  );
}
```

## Workflow scenarios

The `Workflow*` types describe browser workflow demos and Storybook scenarios.
They intentionally model UI navigation and session state only:

```ts
import type { WorkflowScenario } from "@moritzbrantner/frontend-ui";

export const settingsScenario: WorkflowScenario = {
  name: "Authenticated settings",
  initialRoute: "settings",
  initialSession: "authenticated",
};
```

## Split-readiness checklist

This package is a future standalone candidate, but it should stay in this
monorepo until its workflow scope is stable and it has consumer examples that
use only published packages.

Before changing its readiness status:

```sh
bun run --filter @moritzbrantner/frontend-ui verify:release
```

The release gate covers type checking, import linting, unit tests, build,
Storybook interaction tests, and package dry-run contents.
