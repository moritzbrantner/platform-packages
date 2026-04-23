# @moritzbrantner/text-generation

Generates text continuations or responses.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTextGenerationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `text-generation` task.
- Inputs: `text`
- Outputs: `text`
