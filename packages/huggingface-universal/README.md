# @moritzbrantner/huggingface-universal

Task descriptors, typed request/response shapes, and provider/pipeline helpers for Hugging Face inference tasks.

## Main APIs

- `listHuggingFaceTasks()` / `getHuggingFaceTaskDescriptor(task)`
- `createHuggingFaceTaskPackage(task)` / `createUniversalTaskPipeline(options)`
- `createHuggingFaceRouterProvider(options)` plus output normalizers such as `normalizeScoredLabelsOutput(raw)`

## Notes

- Task-specific packages in this repo are thin wrappers over this package.
