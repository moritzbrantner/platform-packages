# @moritzbrantner/depth-estimation

Estimates per-pixel scene depth from an image.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createDepthEstimationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `depth-estimation` task.
- Inputs: `image`
- Outputs: `depth-map`
