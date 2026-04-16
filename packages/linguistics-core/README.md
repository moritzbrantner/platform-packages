# @moritzbrantner/linguistics-core

Unicode-first text documents, segmentation, normalization, anchoring, and analyzer contracts.

## Main APIs

- `createTextDocument({ id?, text, language?, metadata? })`
- `segmentTextDocument(document, { granularity, useIntlSegmenter? })`
- `normalizeText(text, { form, lowercase?, stripDiacritics? })`
- `anchorSpan(document, span)` / `reanchorSpan(document, anchor)`

## Example

```ts
import {
  anchorSpan,
  createTextDocument,
  reanchorSpan,
  segmentTextDocument,
} from "@moritzbrantner/linguistics-core";

const document = segmentTextDocument(
  createTextDocument({
    id: "harbor",
    language: "en",
    text: "The harbor wakes before dawn.",
  }),
  { granularity: "word" },
);

const anchor = anchorSpan(document, { start: 4, end: 10 });
const moved = reanchorSpan(
  createTextDocument({
    id: "edited",
    text: "Earlier draft. The harbor wakes before dawn.",
  }),
  anchor,
);
```
