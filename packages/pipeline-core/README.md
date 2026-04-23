# @moritzbrantner/pipeline-core

Minimal async pipeline primitives with typed artifacts, batching, and provenance-aware composition.

## Main APIs

- `artifact(kind, value, { metadata?, provenance? })`
- `createPipelineStep({ id, input?, output?, run })`
- `createPipeline(step)` / `createPipelineFromRun(run)` / `pipe(...)` / `map(...)` / `tap(...)` / `batch(...)`
