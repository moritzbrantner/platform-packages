# @moritzbrantner/audio-text-to-text

Generates text from combined audio and text context.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createAudioTextToTextPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `audio-text-to-text` task.
- Inputs: `audio`, `text`
- Outputs: `text`
