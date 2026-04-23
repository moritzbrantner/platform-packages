# @moritzbrantner/video-text-to-text

Generates text from video plus optional text prompt.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createVideoTextToTextPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `video-text-to-text` task.
- Inputs: `video`, `text`
- Outputs: `text`
