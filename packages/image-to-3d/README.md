# @moritzbrantner/image-to-3d

Generates 3D assets or point clouds from image input.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageTo3DPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-to-3d` task.
- Inputs: `image`
- Outputs: `point-cloud`
