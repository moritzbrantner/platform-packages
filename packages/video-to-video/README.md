# @moritzbrantner/video-to-video

Transforms an input video into another video.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createVideoToVideoPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `video-to-video` task.
- Inputs: `video`
- Outputs: `video`
