# platform-packages

Shared runtime packages for the Next.js application stack.

## Packages
- `@moritzbrantner/card-games`: visual playing-card components with hover tilt, foil/glass styling, fanned hands, stacked decks, and themed tabletop surfaces.
- `@moritzbrantner/keyboard`: placeholder scaffold for future keyboard-related runtime APIs.
- `@moritzbrantner/maps`: browser map component plus standalone point aggregation utilities for large clustered datasets.
- `@moritzbrantner/parallel-text`: side-by-side original/translation viewer with sentence grouping and token-level alignment highlights.
- `@moritzbrantner/speech`: microphone capture, chunked speech-to-text orchestration, and Whisper-compatible HTTP transcription adapters for live or batch transcription flows.
  Includes local Python and Bun websocket server examples for the default streaming protocol.
- `@moritzbrantner/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@moritzbrantner/storytelling`: branching and scroll-driven storytelling primitives with interactive choices, motion.dev transitions, and optional Remotion/Three.js adapters.
- `@moritzbrantner/word-prediction`: dependency-free next-word suggestion engine for chat-style and keyboard-style text prediction.

## Repository scope
- Runtime packages only.
- No shared eslint or TypeScript config packages in this first extraction wave.
- GitHub Packages publishing is configured through Changesets.
- Includes a local playground app for manually testing package behavior.

## Local development
1. Install dependencies with `bun install`.
2. Scaffold a new package with `bun run create:package <name>`.
3. Start the example pages with `bun run dev:playground`.
4. Build packages and the playground with `bun run build`.
5. Run checks with `bun run lint`, `bun run typecheck`, and `bun run test`.

## Publishing
- The package names use the neutral `@moritzbrantner/*` scope in source.
- Before first GitHub Packages publish, either publish from a matching GitHub org/user scope or rename the packages to your actual GitHub Packages scope.
- See [`docs/publishing.md`](./docs/publishing.md) for the release workflow and scope caveat.
