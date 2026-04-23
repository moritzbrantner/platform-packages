# @moritzbrantner/reinforcement-learning

Runs or exchanges reinforcement learning policies.

## Main APIs

- `huggingFaceTaskDescriptor` / `huggingFaceTask`
- `createReinforcementLearningPipeline(options)` / `createPipeline(options)`
- `createModelReference({ model })`

## Notes

- Thin typed wrapper around `@moritzbrantner/huggingface-universal` for the reinforcement-learning `reinforcement-learning` task.
- Inputs: `model-policy`
- Outputs: `model-policy`
