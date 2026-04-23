# @moritzbrantner/text-to-speech

Synthesizes speech audio from text.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextToSpeechPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the audio `text-to-speech` task.
- Inputs: `text`
- Outputs: `audio`
