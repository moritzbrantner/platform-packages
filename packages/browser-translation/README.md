# @moritzbrantner/browser-translation

Focused browser execution adapter for local text translation.

## Ownership

This package owns browser-specific execution mechanics: WebGPU capability detection, Transformers.js loading, browser-cache model reuse, curated pair-to-model resolution, progress forwarding, and fail-closed output validation.

It does **not** own product workflow/timing semantics, audio/transcription, subtitle rendering, or a generic NLP/model runtime abstraction.

## Curated pairs

- German → English: `onnx-community/opus-mt-de-en`
- English → German: `onnx-community/opus-mt-en-de`

The model is derived from the requested pair. Supplying a mismatched model id is rejected instead of relabeling output with incorrect language metadata.

## Runtime boundary

Browser translation requires WebGPU. There is no CPU, server, or Python fallback. Model assets are acquired lazily by Transformers.js and may be reused from the browser cache. Tests inject the WebGPU/model boundaries and do not download model weights.

The adapter accepts ordered `{ id, text }` segments and returns only ordered translated `{ id, text }` segments plus execution metadata. Timing/media semantics remain caller-owned.
