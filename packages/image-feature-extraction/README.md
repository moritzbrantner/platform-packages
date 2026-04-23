# @moritzbrantner/image-feature-extraction

Converts images into vector features or embeddings.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageFeatureExtractionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-feature-extraction` task.
- Inputs: `image`
- Outputs: `embedding`
