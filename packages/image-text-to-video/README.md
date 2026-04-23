# @moritzbrantner/image-text-to-video

Generates video from image and text conditioning.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageTextToVideoPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `image-text-to-video` task.
- Inputs: `image`, `text`
- Outputs: `video`
