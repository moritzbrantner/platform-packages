# @moritzbrantner/summarization

Condenses text into a shorter summary.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createSummarizationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the natural-language-processing `summarization` task.
- Inputs: `text`
- Outputs: `text`
