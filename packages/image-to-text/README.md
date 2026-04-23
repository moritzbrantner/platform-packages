# @moritzbrantner/image-to-text

Generates text from image input.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageToTextPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-to-text` task.
- Inputs: `image`
- Outputs: `text`
