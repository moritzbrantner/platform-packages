# Deterministic sampling and playback

`@moritzbrantner/flat-design` owns animation evaluation independently of any renderer.

Use `sampleFlatSceneAtTime(scene, timeInMs)` to evaluate authored `motion` plus legacy low-level `animations` into a static scene. The returned scene has sampled opacity/transform values and no remaining motion or SVG animation tags. This is the shared boundary for screenshots, story scrubbing, video renderers, and deterministic tests.

`sampleFlatAnimationAtTime()` and `getFlatAnimationProgress()` expose the lower-level evaluator when an adapter needs animation-level inspection.

The `@moritzbrantner/flat-design/core` entrypoint includes document validation, scene mutations, canonical motion compilation, deterministic sampling, and the headless playback helpers without React editor components.

Headless playback is clock-agnostic: create state with `createFlatPlaybackState()`, then use `setFlatPlaybackPlaying()`, `seekFlatPlayback()`, `restartFlatPlayback()`, and `advanceFlatPlayback()`. Browser/editor/story runtimes decide how elapsed time is produced; flat-design only owns deterministic time state.

Remotion remains responsible for mapping composition frames and FPS to milliseconds. It then delegates scene evaluation to `sampleFlatSceneAtTime()` rather than maintaining its own interpolation implementation.
