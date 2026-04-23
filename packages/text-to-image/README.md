# @moritzbrantner/text-to-image

Generates images from text prompts.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextToImagePipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `text-to-image` task.
- Inputs: `text`
- Outputs: `image`
