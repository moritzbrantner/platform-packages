# @moritzbrantner/source-ingestion

Source-ingestion connectors that normalize HTML pages, plain text, JSON feeds, and dropped files into reproducible `TextDocument` records.

## Main APIs

- `ingestHtml(input)`
- `ingestPlainText(input)`
- `ingestJsonFeed(input)`
- `ingestFileDrop(input)`
- `chunkIngestedDocumentForInference(document, { preset })`

Each ingested document includes:

- `document`: normalized and tokenized `TextDocument`
- `metadata.source`: URL/file identifiers, ingestion timestamps, and language hints
- `sourceOffsets`: cleaned-character offsets mapped back to original source bytes for evidence traceability

## Recommended pipeline chaining

1. `@moritzbrantner/source-ingestion` — connector parsing + cleaning + boilerplate removal.
2. `@moritzbrantner/linguistics-core` — sentence/token/anchor processing.
3. `@moritzbrantner/linguistics-corpus` and/or `@moritzbrantner/text-inference` — retrieval/indexing and model execution on chunk presets.
4. Extraction layer — store extraction spans with `chunk.sourceStart/sourceEnd` plus intra-chunk offsets for reproducible citations.

Use chunk presets for inference compatibility:

- `compact`: smaller sentence chunks for strict context windows.
- `balanced`: default sentence chunks for general extraction tasks.
- `wide`: paragraph-heavy chunks for summarization and long-context tasks.
