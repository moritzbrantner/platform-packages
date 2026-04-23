# @moritzbrantner/zero-shot-object-detection

Detects objects using caller-provided text labels.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createZeroShotObjectDetectionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `zero-shot-object-detection` task.
- Inputs: `image`, `labels`
- Outputs: `boxes`, `labels`
