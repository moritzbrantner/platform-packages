# Legacy Speed Reading Plan and Migration Handoff

## Ownership status

`@moritzbrantner/speed-reading` in this repository is deprecated. The canonical
source for the speed-reading product and shared reader core is now
[moritzbrantner/speedreader](https://github.com/moritzbrantner/speedreader).

This plan is retained as historical context for existing consumers. Do not
implement its phases here. New product work, persistence contracts, and
cross-platform parity checks belong in the canonical repository. The old package
remains available during migration so consumers are neither removed nor silently
redirected.

## Consumer migration

1. Inventory each consumer of `@moritzbrantner/speed-reading`.
2. Migrate it deliberately to the canonical reader package and its platform
   adapter; do not assume the legacy React view is API-compatible.
3. Validate chunking, pacing, Unicode text, and progress restore with the
   canonical shared parity fixtures.
4. Keep this compatibility source and its explicit deprecation metadata until
   every known consumer is migrated. Any final removal or published deprecation
   release is separate release work.

## Historical plan

## Goal

Move `@moritzbrantner/speed-reading` from a compact demo-friendly package toward a reusable reading primitive with clearer package boundaries, better pacing behavior, and stronger library ergonomics. This goal has moved to the canonical repository above.

## Phase 1: Split core behavior from presentation

- Extract playback state and timing into a headless API such as `useSpeedReading` or a session/controller helper.
- Keep `SpeedReadingView` as the default packaged UI on top of that headless layer.
- Make chunk analysis reusable so consumers do not recompute counts, chunks, and progress separately.

Success criteria:

- Consumers can build custom controls and layouts without reimplementing playback logic.
- `SpeedReadingView` becomes a thin renderer plus accessibility defaults.

## Phase 2: Improve chunking and timing quality

- Replace purely whitespace-based chunking with more configurable segmentation.
- Support chunk constraints such as sentence boundaries, max characters, paragraph breaks, and punctuation-aware grouping.
- Improve pacing heuristics for sentence endings, clause breaks, numbers, acronyms, quotes, and longer tokens.
- Expose timing options in a way that supports both simple defaults and advanced tuning.

Success criteria:

- Common prose and PDF-derived text read more naturally at the same WPM.
- Timing behavior is predictable and configurable without patching internal logic.

## Phase 3: Improve component ergonomics

- Reduce styling lock-in by exposing CSS variables, class hooks, slots, or render props.
- Add keyboard controls, pause/resume affordances, and visibility-aware playback behavior.
- Clarify controlled and uncontrolled usage patterns in the public API.

Success criteria:

- The component fits different design systems without forking source.
- The package behaves well in real application shells, not just in the playground.

## Phase 4: Strengthen package contracts

- Add a richer analysis surface such as `analyzeSpeedReadingText()` that returns counts, chunks, and estimated reading duration.
- Expand test coverage for controlled mode, empty input, punctuation edge cases, Unicode, chunk sizes above `1`, and completion behavior.
- Replace the current README stub with real usage guidance and API examples.

Success criteria:

- Consumers can discover the package contract from package docs alone.
- Core behavior is covered by tests that protect future refactors.

## Priority order

1. Headless playback API plus thinner `SpeedReadingView`.
2. Better chunking and timing heuristics.
3. Stronger tests and package README.
4. Styling and accessibility ergonomics.

## Notes for implementation

- Keep package-owned logic in `packages/speed-reading`, not in `examples/playground`.
- Favor small exports with explicit responsibilities over one component doing all orchestration.
- Preserve a simple default path for consumers who only want a drop-in reader.
