# @moritzbrantner/any-to-any

Routes arbitrary input modalities to arbitrary output modalities.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createAnyToAnyPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the multimodal `any-to-any` task.
- Inputs: `any`
- Outputs: `any`
