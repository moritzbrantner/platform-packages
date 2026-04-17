# @moritzbrantner/word-prediction

Next-word prediction for chat-style and keyboard-style text input, with optional semantic backoff built on `@moritzbrantner/word-vectors`.

## Main APIs

- `createWordPredictionModel({ texts?, includeDefaultData?, lowercase?, maxContextSize? })`
- `predictForInput(input, options)` / `predictNextWords(context, options)`
- `WordPredictionComposer`
- `createSemanticBackoffFromWordVectors(model)` / `createSemanticBackoffFromTexts(texts, options)`

## Example

```ts
import {
  createSemanticBackoffFromTexts,
  createWordPredictionModel,
} from "@moritzbrantner/word-prediction";

const model = createWordPredictionModel({
  texts: ["See you soon.", "See you tomorrow."],
});

const semanticBackoff = createSemanticBackoffFromTexts([
  "Harbor workers gather early.",
  "Harbor lights glow softly.",
]);

model.predictNextWords("See you", {
  semanticBackoff,
});
```
