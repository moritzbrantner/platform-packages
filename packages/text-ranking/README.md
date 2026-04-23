# @moritzbrantner/text-ranking

Ranks candidate text passages for a query.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextRankingPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `text-ranking` task.
- Inputs: `text`
- Outputs: `ranking`
