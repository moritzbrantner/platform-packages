# @moritzbrantner/feature-extraction

Converts text into vector features or embeddings.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createFeatureExtractionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `feature-extraction` task.
- Inputs: `text`
- Outputs: `embedding`
