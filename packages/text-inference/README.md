# @moritzbrantner/text-inference

Shared text-model inference contracts, compatibility re-exports for core chunking helpers, and a thin Hugging Face HTTP wrapper for task-specific packages.

## Main APIs

- `createHuggingFaceTextInferenceProvider({ apiKey?, baseUrl?, fetch? })`
- `ensureTextDocument(input, { id?, language?, metadata? })`
- `chunkTextForInference(input, { strategy?, maxCharacters?, overlapCharacters? })`
- `mergeScoredLabels(labelGroups)`
- `collapseFeatureVector(value)` / `averageFeatureVectors(vectors)`

## Notes

- The default Hugging Face base URL targets `https://router.huggingface.co/hf-inference/models`.
- Generic chunking lives in `@moritzbrantner/linguistics-core`; this package re-exports the inference-friendly wrapper for existing callers.
- The package keeps task packages provider-agnostic by exporting separate provider interfaces for classification, embeddings, QA, and summarization.
