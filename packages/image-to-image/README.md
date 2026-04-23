# @moritzbrantner/image-to-image

Transforms an input image into another image.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageToImagePipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-to-image` task.
- Inputs: `image`
- Outputs: `image`
