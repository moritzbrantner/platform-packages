# @moritzbrantner/linguistics-learning

Learning-oriented annotations, study-term derivation, flashcard generation, and spaced-repetition grading built on `@moritzbrantner/linguistics-core`.

## Main APIs

- `createInterlinearBlock(document, alignments)`
- `deriveStudyTerms(document, { minFrequency?, includeNamedEntities?, includeMultiwordTerms? })`
- `createFlashcardSet(terms, { sourceLanguage, targetLanguage })`
- `gradeRecall(result, history)`

## Example

```ts
import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  createFlashcardSet,
  deriveStudyTerms,
  gradeRecall,
} from "@moritzbrantner/linguistics-learning";

const document = createTextDocument({
  id: "lesson",
  language: "en",
  text: "Harbor lights glow. Harbor workers rest.",
});

const terms = deriveStudyTerms(document, { minFrequency: 2 });
const deck = createFlashcardSet(terms, {
  sourceLanguage: "en",
  targetLanguage: "de",
});
const nextReview = gradeRecall({ quality: 4 }, []);
```
