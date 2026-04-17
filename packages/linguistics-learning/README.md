# @moritzbrantner/linguistics-learning

Learning-oriented annotations, corpus-derived study-term extraction, flashcard generation, and spaced-repetition grading built on `@moritzbrantner/linguistics-core` and `@moritzbrantner/linguistics-corpus`.

## Main APIs

- `createInterlinearBlock(document, alignments)`
- `deriveStudyTerms(document, { minFrequency?, includeNamedEntities?, includeMultiwordTerms? })`
- `deriveCorpusStudyTerms(corpus, { minFrequency?, includeNamedEntities?, includeMultiwordTerms?, documentIds?, languages? })`
- `createFlashcardSet(terms, { sourceLanguage, targetLanguage })`
- `gradeRecall(result, history)`

## Example

```ts
import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import {
  createFlashcardSet,
  deriveCorpusStudyTerms,
  gradeRecall,
} from "@moritzbrantner/linguistics-learning";

const corpus = createCorpusIndex([
  createTextDocument({
    id: "lesson-1",
    language: "en",
    text: "Harbor lights glow. Harbor workers rest.",
  }),
  createTextDocument({
    id: "lesson-2",
    language: "en",
    text: "Harbor stories travel. Harbor bells ring.",
  }),
]);

const terms = deriveCorpusStudyTerms(corpus, { minFrequency: 2 });
const deck = createFlashcardSet(terms, {
  sourceLanguage: "en",
  targetLanguage: "de",
});
const nextReview = gradeRecall({ quality: 4 }, []);
```
