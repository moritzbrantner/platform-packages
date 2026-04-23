# @moritzbrantner/sentence-similarity

Scores or embeds sentences for semantic similarity.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createSentenceSimilarityPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `sentence-similarity` task.
- Inputs: `text`
- Outputs: `embedding`, `ranking`
