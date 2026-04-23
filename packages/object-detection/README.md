# @moritzbrantner/object-detection

Detects labeled objects and bounding boxes in images.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createObjectDetectionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `object-detection` task.
- Inputs: `image`
- Outputs: `boxes`, `labels`
