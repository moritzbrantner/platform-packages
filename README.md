# platform-packages

Shared runtime packages for the Next.js application stack.

## Packages
- `@moritzbrantner/keyboard`: placeholder scaffold for future keyboard-related runtime APIs.
- `@moritzbrantner/parallel-text`: side-by-side original/translation viewer with sentence grouping and token-level alignment highlights.
- `@moritzbrantner/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@moritzbrantner/storytelling`: scroll-driven storytelling components built on top of `@moritzbrantner/ui`.
- `@moritzbrantner/word-prediction`: dependency-free next-word suggestion engine for chat-style and keyboard-style text prediction.

## Repository scope
- Runtime packages only.
- No shared eslint or TypeScript config packages in this first extraction wave.
- GitHub Packages publishing is configured through Changesets.
- Includes a local playground app for manually testing package behavior.

## Local development
1. Install dependencies with `pnpm install`.
2. Scaffold a new package with `pnpm create:package <name>`.
3. Start the example pages with `pnpm dev:playground`.
4. Build packages and the playground with `pnpm build`.
5. Run checks with `pnpm lint`, `pnpm typecheck`, and `pnpm test`.

## Publishing
- The package names use the neutral `@moritzbrantner/*` scope in source.
- Before first GitHub Packages publish, either publish from a matching GitHub org/user scope or rename the packages to your actual GitHub Packages scope.
- See [`docs/publishing.md`](./docs/publishing.md) for the release workflow and scope caveat.
