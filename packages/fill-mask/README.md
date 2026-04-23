# @moritzbrantner/fill-mask

Predicts masked tokens in text.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createFillMaskPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `fill-mask` task.
- Inputs: `text`
- Outputs: `text`
