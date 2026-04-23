# @moritzbrantner/text-to-video

Generates video from text prompts.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextToVideoPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `text-to-video` task.
- Inputs: `text`
- Outputs: `video`
