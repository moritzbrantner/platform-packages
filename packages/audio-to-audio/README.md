# @moritzbrantner/audio-to-audio

Transforms input audio into output audio.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createAudioToAudioPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the audio `audio-to-audio` task.
- Inputs: `audio`
- Outputs: `audio`
