# @moritzbrantner/automatic-speech-recognition

Transcribes speech audio into text.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createAutomaticSpeechRecognitionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the audio `automatic-speech-recognition` task.
- Inputs: `audio`
- Outputs: `text`
