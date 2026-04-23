# @moritzbrantner/translation

Translates text between languages.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTranslationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `translation` task.
- Inputs: `text`
- Outputs: `text`
