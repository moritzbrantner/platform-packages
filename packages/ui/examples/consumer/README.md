# `@moritzbrantner/ui` consumer example

This is a minimal external-app shape for checking the package API after `@moritzbrantner/ui` has been built.

```sh
cd packages/ui
bun run build
cd examples/consumer
bun install
bun run build
```

The example intentionally imports from the public package entrypoint and imports exactly one global stylesheet.
