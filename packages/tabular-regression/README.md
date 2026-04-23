# @moritzbrantner/tabular-regression

Predicts continuous values from tabular rows.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTabularRegressionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the tabular `tabular-regression` task.
- Inputs: `table`
- Outputs: `labels`
