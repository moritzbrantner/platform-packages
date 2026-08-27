# @moritzbrantner/parallel-text

Parallel-text alignment models and a React reading view for original text and translations.

## Main APIs

- `createParallelTextModel(options)` / `createAlignmentModel(options)`
- `serializeAlignment(model)` / `parseAlignment(input)`
- `ParallelTextView`

Model helpers are also available from the `@moritzbrantner/parallel-text/model` subpath.

## Styling

Import `@moritzbrantner/parallel-text/styles.css` alongside the selected `@moritzbrantner/ui` theme stylesheet. The package uses Tailwind utilities and shared UI CSS variables instead of owning a separate hard-coded visual system.

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
