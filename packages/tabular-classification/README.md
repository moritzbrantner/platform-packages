# @moritzbrantner/tabular-classification

Assigns labels or scores to tabular rows.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTabularClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the tabular `tabular-classification` task.
- Inputs: `table`
- Outputs: `labels`
