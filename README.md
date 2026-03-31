# platform-packages

Shared runtime packages for the Next.js application stack.

## Packages
- `@platform/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@platform/storytelling`: scroll-driven storytelling components built on top of `@platform/ui`.

## Repository scope
- Runtime packages only.
- No shared eslint or TypeScript config packages in this first extraction wave.
- GitHub Packages publishing is configured through Changesets.

## Local development
1. Install dependencies with `pnpm install`.
2. Build packages with `pnpm build`.
3. Run checks with `pnpm lint`, `pnpm typecheck`, and `pnpm test`.

## Publishing
- The package names use the neutral `@platform/*` scope in source.
- Before first GitHub Packages publish, either publish from a matching GitHub org/user scope or rename the packages to your actual GitHub Packages scope.
- See [`docs/publishing.md`](./docs/publishing.md) for the release workflow and scope caveat.
