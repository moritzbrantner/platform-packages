# platform-packages

Shared runtime packages for the Next.js application stack.

## Packages
- `@moritzbrantner/collaboration`: Automerge-based collaboration state, active-session tracking, and overview helpers/components for table or tree views of who is working on which object.
- `@moritzbrantner/card-games`: visual playing-card components with hover tilt, foil/glass styling, fanned hands, stacked decks, and themed tabletop surfaces.
- `@moritzbrantner/flat-design`: typed SVG scene builder for flat-design illustrations, reusable animation presets, and a React renderer/exporter for image pipelines.
- `@moritzbrantner/keyboard`: placeholder scaffold for future keyboard-related runtime APIs.
- `@moritzbrantner/linguistics-core`: canonical Unicode-first text document model with language tags, normalization, segmentation, and offset-aware range helpers.
- `@moritzbrantner/linguistics-corpus`: in-memory corpus indexing, normalized term and phrase search, concordance generation, and deterministic frequency counts on top of core documents.
- `@moritzbrantner/linguistics-learning`: interlinear annotation rows, study-term derivation, unknown-term detection, and corpus-aware ranking helpers built on the shared document layer.
- `@moritzbrantner/maps`: browser map component plus standalone point aggregation utilities for large clustered datasets.
- `@moritzbrantner/parallel-text`: side-by-side original/translation viewer with sentence grouping and token-level alignment highlights.
- `@moritzbrantner/speech`: microphone capture, chunked speech-to-text orchestration, and Whisper-compatible HTTP transcription adapters for live or batch transcription flows.
  Includes local Python and Bun websocket server examples for the default streaming protocol.
- `@moritzbrantner/subtitles`: timed text parsing, editing, SRT/VTT/JSON serialization, and adapters from speech-style transcript results into subtitle and text-document workflows.
- `@moritzbrantner/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@moritzbrantner/storytelling`: branching and scroll-driven storytelling primitives with interactive choices, motion.dev transitions, and optional Remotion/Three.js adapters.
- `@moritzbrantner/word-prediction`: dependency-free next-word suggestion engine for chat-style and keyboard-style text prediction.

## Repository scope
- Runtime packages only.
- No shared eslint or TypeScript config packages in this first extraction wave.
- GitHub Packages publishing is configured through Changesets.
- Includes a local playground app for manually testing package behavior.
- The language stack is now visible as two combined playground flows:
  `speech -> subtitles -> linguistics-core -> word-prediction` and
  `linguistics-core -> parallel-text -> linguistics-learning`.

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
