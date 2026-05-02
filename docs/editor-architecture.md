# Editor Architecture

This repository now treats editor work as package-owned domain surfaces instead of adding one-off editor behavior to `@moritzbrantner/ui`.

## Package boundaries

- `@moritzbrantner/ui`
  Own shared primitives and shells only: toolbars, inspectors, resizable panels, asset browsers, timelines, graph surfaces, form controls, and theme contracts.
- `@moritzbrantner/flat-design`
  Own scene-native SVG editing, motion authoring, scene mutations, and SVG export.
- `@moritzbrantner/media-editor`
  Own clip and timeline editing, media project state, transport controls, and future subtitle-aware editing flows.
- `@moritzbrantner/workflow-editor`
  Own node-based workflow document types, validation, serialization, and inspector-driven editing once the package is introduced.
- `examples/playground`
  Remains the only integrated app surface in this repository for validating package-backed editors end to end.

## Rules

- Do not move domain editor state or editor-specific mutations into `@moritzbrantner/ui`.
- Build reusable editor packages first, then validate them in the playground.
- Keep the playground thin. If the page needs domain mutations, those mutations should be available from the owning package instead of being reimplemented page-locally.
- Prefer scene-native or document-native editors first. Avoid arbitrary import/edit pipelines until the package-backed model is stable.

## Testing guidance

- DOM-based package tests must run with Vitest so they execute in a jsdom environment.
- Do not rely on raw `bun test <file>` for React DOM suites because it does not provide the browser-like environment those tests need.
- Keep package interaction coverage close to the owning package:
  `packages/flat-design/src` for SVG editor interactions, `packages/media-editor/src` for media editor interactions, and so on.
- Use the playground as an app-like smoke-test target through Vitest or Playwright when a package-backed editor needs integrated coverage.
