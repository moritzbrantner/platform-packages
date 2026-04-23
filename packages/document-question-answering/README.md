# @moritzbrantner/document-question-answering

Answers natural-language questions against document images or PDFs.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createDocumentQuestionAnsweringPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `document-question-answering` task.
- Inputs: `document`, `text`
- Outputs: `text`
