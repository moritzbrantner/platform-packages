# @moritzbrantner/table-question-answering

Answers questions against structured tables.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createTableQuestionAnsweringPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `table-question-answering` task.
- Inputs: `table`, `text`
- Outputs: `text`
