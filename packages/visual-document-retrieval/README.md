# @moritzbrantner/visual-document-retrieval

Retrieves visually relevant documents for a text or multimodal query.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createVisualDocumentRetrievalPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `visual-document-retrieval` task.
- Inputs: `document`, `text`
- Outputs: `ranking`
