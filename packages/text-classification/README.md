# @moritzbrantner/text-classification

Assigns labels or scores to text.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `text-classification` task.
- Inputs: `text`
- Outputs: `labels`
