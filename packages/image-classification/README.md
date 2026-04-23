# @moritzbrantner/image-classification

Assigns labels or scores to images.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-classification` task.
- Inputs: `image`
- Outputs: `labels`
