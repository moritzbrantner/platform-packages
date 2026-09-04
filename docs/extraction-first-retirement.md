# Extraction-First Platform Lifecycle

## Status

`platform-packages` is still an active repository, but it is no longer intended to be the permanent home for an ever-growing collection of unrelated shared packages.

The long-term direction is **extraction first, retirement later**:

1. keep useful package work working and tested;
2. make package boundaries strong enough to stand alone;
3. move valuable capabilities into clear canonical repositories;
4. migrate consumers deliberately;
5. remove only packages that have a verified replacement or are explicitly obsolete;
6. retire this repository only after it no longer owns unique capabilities needed by consumers.

This is not a bulk-deletion plan. Active work should not be discarded merely because the monorepo is transitional.

## Repository rules during the transition

- Do not add a new package as indefinite miscellaneous platform ownership. A genuinely new package should either have a clear reason to incubate here temporarily or a likely canonical destination.
- Existing packages may continue to receive fixes, compatibility work, tests, documentation, and boundary improvements that make extraction safer.
- Active feature work may finish here when it produces a coherent reusable package. Finishing a good boundary is preferable to moving half-formed code simply to reduce repository size.
- Do not delete a package before known consumers have migrated and parity or compatibility evidence exists.
- Preserve public package names and contracts when practical. If extraction requires a breaking contract, treat that as a deliberate migration rather than silently changing consumers.
- Keep routine dependency and security maintenance running while code remains here. Repository retirement is not a reason to let retained packages rot.
- Update the package inventory in `README.md` whenever canonical ownership changes.

## Ownership states

Each package should eventually fall into one of these states:

- **incubating** — still being shaped here; extraction would be premature.
- **extraction-ready** — coherent package boundary, focused tests, package docs, and a plausible standalone owner.
- **external** — canonical implementation lives in another repository; this monorepo only keeps compatibility material while consumers migrate.
- **deprecated** — no longer a preferred capability and retained only for migration/history.
- **removed** — consumers have migrated and the old package source is no longer required here.

The current README statuses (`scaffold-critical`, `release-ready`, `experimental`, `external`, and `deprecated`) remain release-oriented metadata. The ownership states above describe the longer-term repository lifecycle and do not need to replace those statuses immediately.

## Existing precedents

The repository already demonstrates the intended migration pattern:

- `@moritzbrantner/ui` is owned by the standalone `ui` repository and consumed externally.
- `@moritzbrantner/speed-reading` is deprecated here in favor of the canonical `speedreader` repository, with consumer migration required before removal.
- generic timeline editing is owned by `timeline-editor` rather than this monorepo.
- workflow editing is owned by `workflow-editor` rather than this monorepo.

These are the model for future extractions: establish a canonical owner first, migrate deliberately, then remove compatibility source.

## First extraction families

These are prioritization families, not pre-decided repository boundaries. A package can stay here until its destination is genuinely clearer.

### Visual and rendering packages

- `@moritzbrantner/flat-design`
- `@moritzbrantner/remotion`
- `@moritzbrantner/data-density`
- `@moritzbrantner/graphs`
- `@moritzbrantner/tables`
- `@moritzbrantner/hexagon-grids`
- `@moritzbrantner/tree-structures`

The active flat-design A0/A1/A2 work should be allowed to finish because it strengthens the document, motion, and deterministic sampling boundaries needed for a clean extraction. Existing standalone visualization repositories should be checked before inventing new destinations.

### Language, document, and media packages

- `@moritzbrantner/linguistics-core`
- `@moritzbrantner/linguistics-corpus`
- `@moritzbrantner/linguistics-learning`
- `@moritzbrantner/parallel-text`
- `@moritzbrantner/ocr`
- `@moritzbrantner/document-analysis`
- `@moritzbrantner/document-structure-extraction`
- `@moritzbrantner/extraction-schema`
- `@moritzbrantner/information-extraction`
- `@moritzbrantner/speech`
- `@moritzbrantner/subtitles`
- `@moritzbrantner/media-editor`

Prefer a small number of coherent domain homes over creating one repository per tiny helper. Extract when a domain boundary is strong enough to justify independent ownership.

### Scaffold and cross-repository contracts

- `@moritzbrantner/storytelling`
- `@moritzbrantner/oxfmt-config`
- `@moritzbrantner/typescript-config`
- contract packages such as `auth-contract` and `foundation-contract`

These need deliberate consumer migration because they participate in scaffold or cross-repository contracts. They should not be removed merely to make the monorepo smaller.

### New transitional packages

A package introduced while this transition is active, such as the proposed headless infinite-scroll package, should be treated as an incubating capability rather than evidence that `platform-packages` should remain the permanent catch-all. Once the package proves useful, decide whether it belongs in a focused standalone repository, a broader canonical domain repository, or should remain only as a small shared contract.

## Extraction checklist

For each package or coherent package family:

1. Identify the canonical destination and explain why that boundary is better than keeping the package here.
2. Inventory consumers and public entry points.
3. Ensure package-level tests, type checks, build/package smoke checks, and relevant benchmarks are sufficient to protect the move.
4. Move or recreate the capability in the destination while preserving contract semantics where practical.
5. Validate parity against the platform-packages implementation with shared fixtures or differential tests when behavior is non-trivial.
6. Migrate real consumers to the canonical package.
7. Mark the old package `external` or `deprecated` and document the handoff.
8. Remove the old source only after known consumers no longer depend on it.

## Retirement criteria

The repository is ready to archive only when all of the following are true:

- no package here remains the unique canonical implementation of a capability worth maintaining;
- maintained scaffolds no longer require packages owned only by this repository;
- known consumers have migrated from packages marked external or deprecated;
- release/publishing automation is no longer needed for retained compatibility packages;
- the README inventory records the final destinations or retirement status of the former package set.

Until then, the repository remains maintained but shrinking by extraction rather than by arbitrary deletion.
