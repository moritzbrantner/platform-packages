# @moritzbrantner/zero-shot-image-classification

Classifies images against caller-provided labels.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createZeroShotImageClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `zero-shot-image-classification` task.
- Inputs: `image`, `labels`
- Outputs: `labels`
