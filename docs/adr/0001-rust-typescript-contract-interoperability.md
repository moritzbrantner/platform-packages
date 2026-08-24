# ADR 0001: Rust and TypeScript contract interoperability

## Status

Accepted.

## Context

`platform-packages` has browser-facing packages for speech, subtitles, OCR, and
document processing. Several of their TypeScript models describe data that can
also cross a Rust capability boundary. Keeping a second, hand-maintained stable
DTO in each repository would make a compatible-looking change silently drift
in field names, time units, optionality, or validation rules.

The Rust migration program already assigns the stable capability contracts and
their focused WASM packages to capability repositories. This ADR makes the
browser/application boundary explicit without moving browser orchestration or
application semantics into a Rust repository.

## Decision

### Ownership rule

Each exchange DTO has exactly one semantic owner and one publication owner:

- The semantic owner defines the versioned serialized shape, compatibility
  policy, fixtures, and schema artifact.
- The publication owner publishes the package that exposes that shape. For a
  Rust WASM package, that is the capability repository owning the wrapped Rust
  library. For a TypeScript browser package, it is `platform-packages`.
- A TypeScript package may contain a browser-only view, transport, editing, or
  provider model with a similar purpose, but it must not present that model as
  the stable cross-repository DTO. A conversion boundary is required instead.
- New stable cross-repository DTOs must be generated from, or runtime-validated
  against, the semantic owner's schema artifact. A duplicate hand-written
  interface is not an acceptable interchange contract.

This leaves `@moritzbrantner/foundation-contract` as the owner of application
roles, permissions, settings, profiles, notifications, and admin-table data.
Those are platform application semantics, not domain-neutral Rust contracts;
they do not gain a Rust or WASM owner through this decision.

### Contract and package matrix

| Exchange or package surface | Semantic owner | Publication owner | TypeScript disposition |
| --- | --- | --- | --- |
| Text document, text span, and transcript document/segment/word/character JSON | `moritzbrantner/nlp-stack` (`moenarch-text-core` and `moenarch-text-transcripts`) | `nlp-stack`; `@moritzbrantner/text-core-wasm` and `@moritzbrantner/text-transcripts-wasm` | `@moritzbrantner/linguistics-core` keeps its existing public `TextSpan`, `TextDocument`, paragraph, sentence, token, chunk, and related types as platform-local processing models, not stable exchange DTOs. It consumes the released NLP contract through a validating adapter and maps at that boundary. `@moritzbrantner/speech` and `@moritzbrantner/subtitles` likewise validate exchange payloads against the released transcript schema and map their browser models. |
| Browser microphone capture, websocket reconnect state, live-provider response mapping, and React hooks | `moritzbrantner/platform-packages` | `platform-packages` publishes `@moritzbrantner/speech` | The current websocket protocol is an application transport. It is not a replacement for the transcript exchange schema; finalized transcript data converts to the NLP contract. |
| Rust transcription execution request and result envelopes | `moritzbrantner/audio-analysis` (`moenarch-audio-analysis-transcription`) | `audio-analysis`; `@moritzbrantner/audio-analysis-transcription-wasm` | Browser applications use a released wrapper or a versioned envelope adapter; they do not redefine the execution DTO. Finalized transcript payloads use the NLP contract. |
| Timed-text parsing, editor state, ASS/SSA/SRT/WebVTT/YouTube file handling, and cue-local metadata | `moritzbrantner/platform-packages` | `platform-packages` publishes `@moritzbrantner/subtitles` | `TimedTextDocument` remains the browser editing model. Its transcript JSON import/export adapter validates the NLP transcript schema and explicitly converts seconds to the package's millisecond cue fields. |
| OCR exchange document, blocks, lines, tokens, boxes, confidence, and the `image.ocr.*` operation payloads | `moritzbrantner/visual-analysis` (`moenarch-image-analysis-ocr`) | `visual-analysis`; `@moritzbrantner/image-analysis-ocr-wasm` | `@moritzbrantner/ocr` remains the provider/browser orchestration package. Its current `OcrDocument` is not the stable Rust exchange DTO; an adapter must validate the visual schema before import/export. |
| OCR source `Blob`, browser cancellation, video frame plan, post-processing callbacks, and provider configuration | `moritzbrantner/platform-packages` | `platform-packages` publishes `@moritzbrantner/ocr` | Browser runtime values stay TypeScript-only and are never serialized into the Rust OCR exchange schema. |
| Document structure heuristics, editor-oriented tables/sections, extraction prompt schemas, graph-ready records, provider options, and product-specific canonicalization policies | `moritzbrantner/platform-packages` | `platform-packages` publishes `@moritzbrantner/document-structure-extraction`, `@moritzbrantner/extraction-schema`, `@moritzbrantner/information-extraction`, and `@moritzbrantner/document-analysis` | These packages may consume validated OCR/text exchange data, but their own outputs are application semantics today. No Rust semantic owner or WASM wrapper is created by implication. |
| Text inference provider requests/results and text-analysis aggregation | `moritzbrantner/platform-packages` | `platform-packages` publishes `@moritzbrantner/text-inference` and `@moritzbrantner/text-analysis` | Provider-specific payloads remain adapters. Shared text-document data uses the released NLP schema rather than a local duplicate. |

The focused Rust wrappers above remain owned with their wrapped Rust library:

| WASM/npm wrapper | Owner repository | Wrapped semantic library |
| --- | --- | --- |
| `@moritzbrantner/text-core-wasm` | `moritzbrantner/nlp-stack` | `moenarch-text-core` |
| `@moritzbrantner/text-transcripts-wasm` | `moritzbrantner/nlp-stack` | `moenarch-text-transcripts` |
| `@moritzbrantner/audio-analysis-transcription-wasm` | `moritzbrantner/audio-analysis` | `moenarch-audio-analysis-transcription` |
| `@moritzbrantner/image-analysis-ocr-wasm` | `moritzbrantner/visual-analysis` | `moenarch-image-analysis-ocr` |

`platform-packages` must not publish a second wrapper for one of those Rust
libraries. It owns browser adapters that consume a released wrapper or
schema/HTTP/file envelope, never a copied WASM artifact. Adding a wrapper,
renaming one, or transferring its publication owner requires an exact release
issue and manifest in the owning capability repository.

### Schema generation and validation

For each stable Rust exchange family, the semantic owner publishes these
versioned release inputs together:

1. a JSON Schema Draft 2020-12 artifact derived from the Rust serialized
   contract, including its schema identifier and semantic version;
2. canonical valid JSON fixtures serialized by the Rust contract, plus invalid JSON
   fixtures deliberately mutated from canonical fixtures or independently authored
   to violate the contract;
3. generated TypeScript declarations or a deterministic generator input; and
4. a compatibility note identifying additive, deprecated, and breaking fields.

The schema artifact—not a separately authored TypeScript interface—is the
source for the TypeScript declaration. TypeScript declarations alone do not
validate runtime JSON: platform adapters validate untrusted JSON with the
released JSON Schema (or a deterministic generated runtime decoder) before
converting it to their local model. The adapter records the schema identifier
and version with persisted exchange data whenever the surrounding format has
metadata.

Rust's serialized shape must preserve its declared casing, aliases, defaults,
units, and nullability in the generated schema. A field that exists only to
serve a browser runtime (`Blob`, `AbortSignal`, callback, `RegExp`, React
state, or provider credential) is excluded from the exchange schema.

Until an adapter is implemented, the packages in the matrix may keep their
existing local models. They must not add a new claimed-stable interchange DTO
or a second Rust/WASM wrapper. Implementing an adapter is a follow-up slice;
it must remove or isolate the overlapping hand-written exchange type rather
than retaining two public stable definitions.

### Required release and smoke evidence

The following pattern is required before a stable schema or focused WASM/npm
wrapper is released. The commands are a release checklist pattern, not an
authorization to publish from this repository.

1. In the semantic-owner repository, generate the schema and declarations from
   the exact Rust release commit. Deserialize the Rust-produced valid fixtures
   successfully with Rust and accept them with the generated TypeScript runtime
   validator. Reject each deliberately invalid fixture with both the Rust
   deserializer or validator and the generated TypeScript runtime validator.
2. Pack the exact wrapper with its normal package command (`wasm-pack pack` for
   a Rust WASM package or `bun pm pack` for a TypeScript package); inspect the
   tarball for generated declarations, schema, and runtime assets rather than
   source paths or local build output.
3. In a new temporary directory, install only that tarball with Bun, import its
   documented public entrypoint, load one valid fixture, and reject one invalid
   fixture. The install must have no workspace, sibling-path, or moving-branch
   Git dependency.
4. For a platform adapter, repeat the fixture validation against the exact
   released schema package or wrapper version it declares, and keep the
   adapter's browser-only conversion in a focused test.

The release issue records the exact artifact versions and commands. A successful
manifest inspection, typecheck, or build does not substitute for this isolated
pack/install/fixture proof. This ADR authorizes no npm, GitHub Packages, Cargo,
or WASM publication.

## Consequences

- Stable Rust contracts evolve in their capability repository; platform
  packages consume them through versioned serialized artifacts and adapters.
- Browser/UI and product orchestration remain in `platform-packages`, avoiding
  a reverse application dependency from capability repositories.
- Similar local TypeScript models are permitted only where their boundary and
  conversion are explicit, which prevents a second stable DTO from drifting
  unnoticed.
- Existing package names and public behavior remain unchanged. No wrapper is
  moved, deleted, published, or versioned by this ADR.
