# Flat-design motion

`motion` is the canonical authored animation model. A `FlatPresetMotionSpec` resolves to a `FlatTimelineMotionSpec`, and timeline motion compiles to renderer-specific SVG animation primitives only at the rendering boundary.

Timeline motion uses typed, renderer-neutral timing:

- `durationMs` and optional `delayMs`
- `repeatCount` as a positive number or `"indefinite"`
- `direction` as `normal`, `reverse`, or `alternate`
- `fillMode` as `remove` or `freeze`
- `easing` as `linear`, `ease-in`, `ease-out`, `ease-in-out`, or a typed cubic-bezier object
- ordered keyframes with translate, scale, rotate, and opacity values

Use `resolveFlatMotion()` when authoring tools need the concrete editable timeline behind a preset. Use `compileFlatMotion()` when an SVG renderer needs low-level `<animate>` / `<animateTransform>` data.

The legacy `animations` array on shapes remains supported as a low-level SVG escape hatch and is appended after compiled `motion`. New editor and document features should prefer `motion` so the same scene can later be sampled deterministically by non-SVG renderers.
