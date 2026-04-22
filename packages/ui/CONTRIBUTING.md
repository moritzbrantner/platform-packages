# Contributing to `@moritzbrantner/ui`

`@moritzbrantner/ui` is the workspace design-system package. It should stay focused on reusable UI, not application workflows.

## Boundaries

Belongs in `@moritzbrantner/ui`:

- Design tokens and theme metadata.
- Primitive controls.
- Shared composed components.
- Layout primitives.
- Accessibility and interaction helpers that apply across projects.

Belongs outside `@moritzbrantner/ui`:

- Auth flows.
- Profile screens.
- Upload management flows.
- Settings pages.
- Data-entry workflows.
- Product-specific empty states or onboarding flows.

Use `@moritzbrantner/foundation-ui` for product patterns that compose the design system with contracts, runtime data, or application behavior.

## Component checklist

Before exporting a component:

- It accepts `className`.
- It forwards standard DOM props.
- It uses `data-slot`.
- It uses semantic tokens from `styles.css`.
- It exposes variants for intentional design states.
- It does not expose arbitrary visual knobs.
- It has Storybook coverage.
- It has focused tests for rendering and important accessibility behavior.
- It is exported from `src/index.ts`.

## Storybook checklist

Every public component needs either a dedicated story file or aggregate catalog coverage.

Cover these states when they apply:

- Default.
- Variants.
- Sizes.
- Disabled.
- Error or invalid.
- Loading.
- Keyboard and focus behavior.
- Light and dark rendering.

## Release checklist

Run these commands before release:

```sh
bun run --filter @moritzbrantner/ui check-types
bun run --filter @moritzbrantner/ui lint
bun run --filter @moritzbrantner/ui test
bun run --filter @moritzbrantner/ui build
bun run --filter @moritzbrantner/ui test:storybook
bun run --filter @moritzbrantner/ui test:package
cd packages/ui && npm pack --dry-run --ignore-scripts --json
```
