# @moritzbrantner/image-to-video

Generates video from an image.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageToVideoPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-to-video` task.
- Inputs: `image`
- Outputs: `video`
