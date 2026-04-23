# @moritzbrantner/unconditional-image-generation

Generates images without a conditioning prompt.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createUnconditionalImageGenerationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `unconditional-image-generation` task.
- Inputs: `any`
- Outputs: `image`
