# @moritzbrantner/audio-classification

Assigns labels or scores to audio.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createAudioClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the audio `audio-classification` task.
- Inputs: `audio`
- Outputs: `labels`
