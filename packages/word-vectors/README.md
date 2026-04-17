# @moritzbrantner/word-vectors

Word vectors with similarity search, context inspection, serialization, and corpus-aware training adapters built on the linguistics stack.

## Main APIs

- `createWordVectorModel({ texts?, windowSize?, minWordCount?, maxVocabularySize? })`
- `serializeWordVectorModel(model)` / `deserializeWordVectorModel(json)`
- `findSimilarWords(word)` / `findSimilarContexts(word)`
- `trainFromDocuments(documents)` / `trainFromCorpus(corpus)`

## Example

```ts
import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import { createWordVectorModel, trainFromCorpus } from "@moritzbrantner/word-vectors";

const model = createWordVectorModel({
  texts: ["Coffee beans smell rich.", "Tea leaves smell fresh."],
});

const corpus = createCorpusIndex([
  createTextDocument({ id: "doc-1", text: "Coffee cups stay warm." }),
  createTextDocument({ id: "doc-2", text: "Tea leaves smell fresh." }),
]);

model.findSimilarWords("coffee");
model.findSimilarContexts("coffee");

trainFromCorpus(corpus);
```
