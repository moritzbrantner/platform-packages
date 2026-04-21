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

## Package Inventory

This inventory is the source-of-truth view for release readiness. Status values mean:

- scaffold-critical: consumed by the maintained scaffold family and validated before scaffold releases.
- release-ready: ready for the first non-scaffold standalone install wave.
- generated task wrapper: typed Hugging Face task package generated around `@moritzbrantner/huggingface-universal`.
- experimental: valid workspace package, but not part of the first publish expansion.

| Package | Status | Notes |
| --- | --- | --- |
| `@moritzbrantner/any-to-any` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/audio-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/audio-text-to-text` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/audio-to-audio` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/automatic-speech-recognition` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/card-games` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/charts` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/collaboration` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/data-density` | release-ready | Included in the first standalone install wave. |
| `@moritzbrantner/depth-estimation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/document-analysis` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/document-question-answering` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/document-structure-extraction` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/eslint-config` | scaffold-critical | Shared scaffold contract surface. |
| `@moritzbrantner/extraction-schema` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/feature-extraction` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/fill-mask` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/flat-design` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/graphs` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/hexagon-grids` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/huggingface-universal` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/image-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-feature-extraction` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-segmentation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-text-to-image` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-text-to-text` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-text-to-video` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-to-3d` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-to-image` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-to-text` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/image-to-video` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/information-extraction` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/keyboard` | experimental | Browser-safe shortcut registry and matching helpers. |
| `@moritzbrantner/keypoint-detection` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/linguistics-core` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/linguistics-corpus` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/linguistics-learning` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/maps` | release-ready | Included in the first standalone install wave. |
| `@moritzbrantner/mask-generation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/media-editor` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/object-detection` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/ocr` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/parallel-text` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/pipeline-core` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/question-answering` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/reinforcement-learning` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/sentence-similarity` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/sentiment-analysis` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/source-ingestion` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/speech` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/speed-reading` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/storytelling` | scaffold-critical | Shared scaffold contract surface. |
| `@moritzbrantner/subtitles` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/summarization` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/syntax-analysis` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/table-question-answering` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/tables` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/tabular-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/tabular-regression` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-analysis` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/text-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-generation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-inference` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/text-ranking` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-summarization` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/text-to-3d` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-to-image` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-to-speech` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/text-to-video` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/token-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/translation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/tree-structures` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/typescript-config` | scaffold-critical | Shared scaffold contract surface. |
| `@moritzbrantner/ui` | scaffold-critical | Shared scaffold contract surface. |
| `@moritzbrantner/unconditional-image-generation` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/video-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/video-text-to-text` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/video-to-video` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/visual-document-retrieval` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/visual-question-answering` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/word-prediction` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/word-vectors` | experimental | Implemented or incubating runtime package outside the scaffold release set. |
| `@moritzbrantner/zero-shot-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/zero-shot-image-classification` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |
| `@moritzbrantner/zero-shot-object-detection` | generated task wrapper | Thin typed Hugging Face universal task wrapper. |

## Packages

- `@moritzbrantner/collaboration`: Automerge-based collaboration state, active-session tracking, and overview helpers/components for table or tree views of who is working on which object.
- `@moritzbrantner/card-games`: visual playing-card components with hover tilt, foil/glass styling, fanned hands, stacked decks, and themed tabletop surfaces.
- `@moritzbrantner/charts`: chart-ready density adapters for binned numeric series, sample extraction, and metric-preserving viewport summaries.
- `@moritzbrantner/data-density`: reusable indexing, windowing, binning, clustering, and metric aggregation helpers for high-volume maps, charts, tables, and timeline-style views.
- `@moritzbrantner/flat-design`: typed SVG scene builder for flat-design illustrations, reusable animation presets, and a React renderer/exporter for image pipelines.
- `@moritzbrantner/graphs`: node-link graph density helpers for node windows, subgraph extraction, and edge metric aggregation.
- `@moritzbrantner/hexagon-grids`: globe-aware H3 hex indexing, polygon coverage, neighborhood/path helpers, and point aggregation into hex cells.
- `@moritzbrantner/keyboard`: browser-safe shortcut parsing, platform-aware modifier labels, editable-target guards, and scoped command registry helpers.
- `@moritzbrantner/document-analysis`: orchestration layer that combines OCR/text normalization with summarization, sentiment, text analysis, and question answering into one document report.
- `@moritzbrantner/linguistics-core`: Unicode-first text documents, normalization, segmentation, and span anchoring for browser-safe language tooling.
- `@moritzbrantner/linguistics-corpus`: in-memory corpus indexing with metadata filters, concordance windows, multilingual term frequencies, and density-aware corpus windows.
- `@moritzbrantner/linguistics-learning`: interlinear annotation, corpus-derived study-term extraction, flashcard derivation, and SM-2 style recall grading on top of the corpus layer.
- `@moritzbrantner/maps`: browser map component built on the shared data-density geo aggregation utilities for large clustered datasets.
- `@moritzbrantner/question-answering`: chunk-aware extractive question answering pipeline with ranked answers across long contexts.
- `@moritzbrantner/parallel-text`: side-by-side original/translation viewer with sentence grouping and token-level alignment highlights.
- `@moritzbrantner/pipeline-core`: provider-neutral pipeline primitives, typed artifacts, ports, provenance, batching, mapping, tapping, and step composition.
- `@moritzbrantner/sentiment-analysis`: label-normalized sentiment scoring on top of text-classification models, with chunk aggregation for longer texts.
- `@moritzbrantner/speech`: microphone capture, chunked speech-to-text orchestration, and Whisper-compatible HTTP transcription adapters for live or batch transcription flows.
  Includes local Python and Bun websocket server examples for the default streaming protocol.
- `@moritzbrantner/subtitles`: SRT/VTT/transcript timed-text parsing, editing, validation, overlap detection, and word-level timing preservation.
- `@moritzbrantner/tables`: virtualized table-window helpers with density-aware row summaries, row lookup, and lightweight column descriptors.
- `@moritzbrantner/text-analysis`: composable labels, entities, embeddings, and keyword extraction pipeline over raw text or `TextDocument`s.
- `@moritzbrantner/source-ingestion`: HTML, plain-text, JSON feed, and file-drop ingestion into segmented `TextDocument`s with source-offset preserving chunks.
- `@moritzbrantner/text-inference`: text task contracts, re-exported core chunking helpers, and Hugging Face HTTP wrappers used by the text-focused AI packages.
- `@moritzbrantner/text-summarization`: chunked summarization pipeline with optional multi-pass reduction for longer documents.
- `@moritzbrantner/tree-structures`: parent-link tree indexing, traversal helpers, subtree queries, and aggregate tree statistics for hierarchy-heavy data.
- `@moritzbrantner/ui`: Tailwind 4 compatible UI primitives plus the shared theme/style contract.
- `@moritzbrantner/storytelling`: branching and scroll-driven storytelling primitives with interactive choices, motion.dev transitions, and optional Remotion/Three.js adapters.
- `@moritzbrantner/word-prediction`: next-word suggestion engine for chat-style and keyboard-style text prediction, with optional semantic backoff from word vectors.
- `@moritzbrantner/word-vectors`: distributional word vectors with similarity lookup, context inspection, persistence, and corpus-aware training adapters.

## Dependency design

- `@moritzbrantner/linguistics-core` is the base document and segmentation layer.
- `@moritzbrantner/linguistics-corpus` builds on core and owns corpus indexing, concordance, and term frequency logic.
- `@moritzbrantner/linguistics-core` owns generic text chunking so ingestion and inference can share source-span preserving chunks without depending on each other.
- `@moritzbrantner/source-ingestion` feeds `TextDocument`s into downstream text and document pipelines while staying below provider-specific inference packages.
- `@moritzbrantner/text-inference` adds provider contracts, Hugging Face routing, and compatibility re-exports for core chunking.
- `@moritzbrantner/pipeline-core` owns provider-neutral pipeline composition. Provider packages such as `@moritzbrantner/huggingface-universal` can expose task-specific pipelines without owning generic orchestration contracts.
- `@moritzbrantner/question-answering`, `@moritzbrantner/text-analysis`, `@moritzbrantner/sentiment-analysis`, and `@moritzbrantner/text-summarization` all build on that shared text-inference layer so task packages stay consistent while providers remain swappable.
- `@moritzbrantner/document-analysis` sits above OCR plus the text task packages to produce a single document report from raw text or scanned input.
- `@moritzbrantner/word-vectors` builds on corpus-backed documents so similarity models are trained from an explicit corpus layer.
- `@moritzbrantner/linguistics-learning` sits above corpus so study-term extraction can aggregate across documents instead of only per-document text.
- `@moritzbrantner/word-prediction` sits above word vectors and can use them for semantic backoff when exact n-gram context is sparse.
- `@moritzbrantner/data-density` is the shared high-volume data layer for viewport queries, metric reductions, chart binning, table windows, and geo point clustering.
- `@moritzbrantner/charts` consumes data-density binning and exposes chart-shaped samples without taking on a renderer dependency.
- `@moritzbrantner/graphs` consumes data-density windows and metric reductions for node-link graph subgraphs.
- `@moritzbrantner/tables` consumes data-density windows for virtualized row slices and metric-preserving table summaries.
- `@moritzbrantner/maps` consumes data-density for clustering while keeping MapLibre rendering and map-specific interaction in the maps package.
- `@moritzbrantner/tree-structures` is dependency-free hierarchy infrastructure for packages that need validated parent/child indexes or traversal without taking on graph semantics.
- The playground is intended to validate those layers in order: core and corpus pages establish the text model, vectors and learning consume corpus data, and speech exercises prediction with vector-backed backoff.

## Naming split

- `@moritzbrantner/summarization`, `@moritzbrantner/automatic-speech-recognition`, and `@moritzbrantner/document-question-answering` are thin Hugging Face task wrappers.
- `@moritzbrantner/text-summarization`, `@moritzbrantner/speech`, and `@moritzbrantner/question-answering` are provider-neutral or browser/domain packages with higher-level orchestration APIs.

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
