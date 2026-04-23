# @moritzbrantner/keypoint-detection

Detects landmark or pose keypoints in images.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createKeypointDetectionPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `keypoint-detection` task.
- Inputs: `image`
- Outputs: `keypoints`
