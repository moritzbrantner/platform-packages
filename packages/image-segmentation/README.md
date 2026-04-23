# @moritzbrantner/image-segmentation

Segments an image into object or semantic masks.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createImageSegmentationPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the computer-vision `image-segmentation` task.
- Inputs: `image`
- Outputs: `mask`
