# @moritzbrantner/image-text-to-image

Generates or edits images from image and text conditioning.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageTextToImagePipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `image-text-to-image` task.
- Inputs: `image`, `text`
- Outputs: `image`
