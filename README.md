# platform-packages

Shared packages for the maintained scaffold family. This repo stays broad on purpose, but only part of it is scaffold-critical for cross-repo alignment.

## Scaffold-critical package set

The maintained template family should converge on these packages first:

- `@moritzbrantner/ui`
- `@moritzbrantner/storytelling`
- `@moritzbrantner/eslint-config`
- `@moritzbrantner/typescript-config`

These four packages are the current scaffold-facing contract for `monorepo`, `next-template`, `expo-template`, and `electron-template`.

Everything else in this repository remains valid, but is not required for `scaffold-v2` alignment.

## Packages

- `@moritzbrantner/collaboration`: Automerge-based collaboration state, active-session tracking, and overview helpers/components for table or tree views of who is working on which object.
- `@moritzbrantner/card-games`: visual playing-card components with hover tilt, foil/glass styling, fanned hands, stacked decks, and themed tabletop surfaces.
- `@moritzbrantner/flat-design`: typed SVG scene builder for flat-design illustrations, reusable animation presets, and a React renderer/exporter for image pipelines.
- `@moritzbrantner/hexagon-grids`: globe-aware H3 hex indexing, polygon coverage, neighborhood/path helpers, and point aggregation into hex cells.
- `@moritzbrantner/keyboard`: placeholder scaffold for future keyboard-related runtime APIs.
- `@moritzbrantner/document-analysis`: orchestration layer that combines OCR/text normalization with summarization, sentiment, text analysis, and question answering into one document report.
- `@moritzbrantner/linguistics-core`: Unicode-first text documents, normalization, segmentation, and span anchoring for browser-safe language tooling.
- `@moritzbrantner/linguistics-corpus`: in-memory corpus indexing with metadata filters, concordance windows, and multilingual term frequencies.
- `@moritzbrantner/linguistics-learning`: interlinear annotation, corpus-derived study-term extraction, flashcard derivation, and SM-2 style recall grading on top of the corpus layer.
- `@moritzbrantner/maps`: browser map component plus standalone point aggregation utilities for large clustered datasets.
- `@moritzbrantner/question-answering`: chunk-aware extractive question answering pipeline with ranked answers across long contexts.
- `@moritzbrantner/parallel-text`: side-by-side original/translation viewer with sentence grouping and token-level alignment highlights.
- `@moritzbrantner/sentiment-analysis`: label-normalized sentiment scoring on top of text-classification models, with chunk aggregation for longer texts.
- `@moritzbrantner/speech`: microphone capture, chunked speech-to-text orchestration, and Whisper-compatible HTTP transcription adapters for live or batch transcription flows.
  Includes local Python and Bun websocket server examples for the default streaming protocol.
- `@moritzbrantner/subtitles`: SRT/VTT/transcript timed-text parsing, editing, validation, overlap detection, and word-level timing preservation.
- `@moritzbrantner/text-analysis`: composable labels, entities, embeddings, and keyword extraction pipeline over raw text or `TextDocument`s.
- `@moritzbrantner/text-inference`: shared chunking, task contracts, and Hugging Face HTTP wrappers used by the text-focused AI packages.
- `@moritzbrantner/text-summarization`: chunked summarization pipeline with optional multi-pass reduction for longer documents.
- `@moritzbrantner/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@moritzbrantner/storytelling`: branching and scroll-driven storytelling primitives with interactive choices, motion.dev transitions, and optional Remotion/Three.js adapters.
- `@moritzbrantner/word-prediction`: next-word suggestion engine for chat-style and keyboard-style text prediction, with optional semantic backoff from word vectors.
- `@moritzbrantner/word-vectors`: distributional word vectors with similarity lookup, context inspection, persistence, and corpus-aware training adapters.

## Dependency design

- `@moritzbrantner/linguistics-core` is the base document and segmentation layer.
- `@moritzbrantner/linguistics-corpus` builds on core and owns corpus indexing, concordance, and term frequency logic.
- `@moritzbrantner/text-inference` adds provider contracts, Hugging Face routing, and shared chunking on top of core documents.
- `@moritzbrantner/question-answering`, `@moritzbrantner/text-analysis`, `@moritzbrantner/sentiment-analysis`, and `@moritzbrantner/text-summarization` all build on that shared text-inference layer so task packages stay consistent while providers remain swappable.
- `@moritzbrantner/document-analysis` sits above OCR plus the text task packages to produce a single document report from raw text or scanned input.
- `@moritzbrantner/word-vectors` builds on corpus-backed documents so similarity models are trained from an explicit corpus layer.
- `@moritzbrantner/linguistics-learning` sits above corpus so study-term extraction can aggregate across documents instead of only per-document text.
- `@moritzbrantner/word-prediction` sits above word vectors and can use them for semantic backoff when exact n-gram context is sparse.
- The playground is intended to validate those layers in order: core and corpus pages establish the text model, vectors and learning consume corpus data, and speech exercises prediction with vector-backed backoff.

## Repository scope

- The repository remains broad and can host shared runtime, tooling, and domain packages.
- The scaffold-critical set is limited to `ui`, `storytelling`, `eslint-config`, and `typescript-config`.
- Unrelated packages stay in place and are not blocked on the template-family release cadence.
- GitHub Packages publishing is configured through Changesets.
- Includes a local playground app for manually testing package behavior.

## Styling rule

- Package-authored styling must use Tailwind CSS.
- Prefer inline Tailwind utility classes in components over page-specific custom CSS selectors.
- If a package ships CSS, it must expose a root `styles.css` file, import `tailwindcss`, declare package-local `@source` paths, and export `./styles.css` from `package.json`.
- The repository lint step verifies that contract for every package that publishes styles.

## Local development

1. Install dependencies with `bun install`.
2. Scaffold a new package with `bun run create:package <name>`.
3. Start the example pages with `bun run dev:playground`.
4. Build packages and the playground with `bun run build`.
5. Run checks with `bun run lint`, `bun run typecheck`, and `bun run test`.

## Publishing

- The package names use the neutral `@moritzbrantner/*` scope in source.
- Before first GitHub Packages publish, either publish from a matching GitHub org/user scope or rename the packages to your actual GitHub Packages scope.
- Publish or prepare releasable versions of the scaffold-critical package set before widening the release scope to the rest of the repository.
- Do not move `@repo/auth-contract` or `@repo/upload-playbook` into this repository until real multi-repo reuse exists.
- See [`docs/publishing.md`](./docs/publishing.md) for the release workflow and scope caveat.
- See [SCAFFOLD_ALIGNMENT.md](./SCAFFOLD_ALIGNMENT.md) for the scaffold-family alignment contract for this repository.
