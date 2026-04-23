# @moritzbrantner/mask-generation

Generates masks for objects or regions in images.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createMaskGenerationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `mask-generation` task.
- Inputs: `image`
- Outputs: `mask`
