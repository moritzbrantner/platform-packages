# @moritzbrantner/word-vectors

Dependency-light word vectors with similarity search, context inspection, serialization, and document adapters.

## Main APIs

- `createWordVectorModel({ texts?, windowSize?, minWordCount?, maxVocabularySize? })`
- `serializeWordVectorModel(model)` / `deserializeWordVectorModel(json)`
- `findSimilarWords(word)` / `findSimilarContexts(word)`
- `trainFromDocuments(documents)` from `@moritzbrantner/word-vectors/documents`

## Example

```ts
import { createWordVectorModel } from "@moritzbrantner/word-vectors";
import { trainFromDocuments } from "@moritzbrantner/word-vectors/documents";

const model = createWordVectorModel({
  texts: ["Coffee beans smell rich.", "Tea leaves smell fresh."],
});

model.findSimilarWords("coffee");
model.findSimilarContexts("coffee");

trainFromDocuments([]);
```
