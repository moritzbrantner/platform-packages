# @moritzbrantner/video-classification

Assigns labels or scores to videos.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createVideoClassificationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `video-classification` task.
- Inputs: `video`
- Outputs: `labels`
