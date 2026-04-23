# @moritzbrantner/token-classification

Assigns labels to spans or tokens in text.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTokenClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `token-classification` task.
- Inputs: `text`
- Outputs: `labels`
