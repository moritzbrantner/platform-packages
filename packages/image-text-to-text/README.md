# @moritzbrantner/image-text-to-text

Generates text from an image plus optional text prompt.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageTextToTextPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `image-text-to-text` task.
- Inputs: `image`, `text`
- Outputs: `text`
