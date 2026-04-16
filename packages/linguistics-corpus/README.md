# @moritzbrantner/linguistics-corpus

In-memory corpus indexing, metadata-aware search, concordance extraction, and frequency summaries built on `@moritzbrantner/linguistics-core`.

## Main APIs

- `createCorpusIndex(documents)`
- `searchCorpus(index, query, { fields?, languages?, metadataFilters?, limit? })`
- `concordance(index, term, { windowTokens?, documentIds? })`
- `termFrequencies(index, { byLanguage?, minCount? })`

## Example

```ts
import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";

const index = createCorpusIndex([
  createTextDocument({
    id: "en-market",
    language: "en",
    metadata: { genre: "travel" },
    text: "The harbor market wakes early.",
  }),
]);

index.searchCorpus("harbor");
index.concordance("market");
index.termFrequencies({ byLanguage: true });
```
