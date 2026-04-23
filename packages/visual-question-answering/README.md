# @moritzbrantner/visual-question-answering

Answers natural-language questions about visual inputs.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createVisualQuestionAnsweringPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `visual-question-answering` task.
- Inputs: `image`, `text`
- Outputs: `text`
