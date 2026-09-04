# @moritzbrantner/parallel-text

Parallel-text alignment models and React reading views for original text and translations.

## Main APIs

- `createParallelTextModel(options)` / `createAlignmentModel(options)`
- `serializeAlignment(model)` / `parseAlignment(input)`
- `ParallelTextView` for interactive bilingual alignment and token inspection
- `MultilingualText` for deterministic N-column passage rendering
- `ParallelText` as the simple two-column compatibility wrapper around `MultilingualText`

Model helpers are also available from the `@moritzbrantner/parallel-text/model` subpath.

## Demo

The focused GitHub Pages example is published at `https://moritzbrantner.github.io/platform-packages/parallel-text/` after changes reach `main` and Pages is enabled for the repository.

The playground includes a Latin/English/German Aquinas-style passage to dogfood `MultilingualText` without moving Aquinas-specific corpus ownership into this package.

## Ownership boundary

This package owns presentation and alignment primitives. It does not own author/work identity, canonical citations, edition rights, theological structure, or corpus ingestion. Consumers such as Thomistisch should keep those domain contracts in their canonical repository and map them into `MultilingualText` columns and segments.

`MultilingualText` deliberately uses stable caller-supplied segment IDs as DOM anchors. This makes it suitable for citations and annotations while keeping the package agnostic about how those IDs are constructed.

## Styling

Import `@moritzbrantner/parallel-text/styles.css` alongside the selected `@moritzbrantner/ui` theme stylesheet. The package uses Tailwind utilities and shared UI CSS variables instead of owning a separate hard-coded visual system.

## Multilingual reading

`MultilingualText` accepts an ordered list of columns and aligned segments. Each column can provide `lang` and `dir` metadata, and each segment supplies cells keyed by column ID. The responsive grid can render two, three, or more editions without changing the underlying segment identity.

Use `ParallelText` when a caller only needs a source/target pair and does not need the richer alignment interaction of `ParallelTextView`.

## Reading layouts

`ParallelTextView` defaults to `layout="aligned"`. Each `ParallelTextAlignmentRow` is rendered as one responsive source/translation pair, so one-to-many, many-to-one, and reordered sentence mappings stay vertically associated.

Use `layout="flow"` for continuous paragraph reading when strict row alignment is less important than book-like text flow.

## Language metadata

The original side accepts `originalLanguage`, `originalLanguageCode`, and `originalDirection`. Direct translations accept `translationLanguage`, `translationLanguageCode`, and `translationDirection`; entries in `translations` can provide their own `language`, `languageCode`, and `direction` values.

Language codes are forwarded through `lang`, and direction is forwarded through `dir`, so consuming applications can provide correct text semantics for LTR and RTL material.

## Alignment provenance

Sentence rows and token links expose a `source` with one of four values:

- `manual`: explicitly curated alignment.
- `model`: alignment supplied by a model or external aligner.
- `heuristic`: package-derived alignment that is useful context but not verified.
- `unverified`: content present without a claimed cross-side alignment.

Explicit alignment input defaults to `manual` for compatibility. Automatic sentence grouping is marked `heuristic`. Token-level heuristics only link unique normalized tokens that are literally shared across both sides; positional fallback no longer creates word-to-word links. When no exact token link exists, the reader can still highlight the aligned sentence context without implying that two words are translations of each other.

## Keyboard interaction

Words remain normal inline text. Each sentence is one focusable reading unit. With a sentence focused, use Left/Right Arrow, Home, and End to inspect its tokens; Escape clears the token selection. This avoids turning every word into a separate tab stop while preserving keyboard access to alignment highlighting.
