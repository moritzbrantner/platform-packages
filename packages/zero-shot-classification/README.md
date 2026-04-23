# @moritzbrantner/zero-shot-classification

Classifies text against caller-provided labels.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createZeroShotClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `zero-shot-classification` task.
- Inputs: `text`, `labels`
- Outputs: `labels`
