# @moritzbrantner/text-to-3d

Generates 3D assets or point clouds from text prompts.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextTo3DPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `text-to-3d` task.
- Inputs: `text`
- Outputs: `point-cloud`
