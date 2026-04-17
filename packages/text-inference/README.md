# @moritzbrantner/text-inference

Shared text-model inference contracts, chunking helpers, and a thin Hugging Face HTTP wrapper for task-specific packages.

## Main APIs

- `createHuggingFaceTextInferenceProvider({ apiKey?, baseUrl?, fetch? })`
- `ensureTextDocument(input, { id?, language?, metadata? })`
- `chunkTextForInference(input, { strategy?, maxCharacters?, overlapCharacters? })`
- `mergeScoredLabels(labelGroups)`
- `collapseFeatureVector(value)` / `averageFeatureVectors(vectors)`

## Notes

- The default Hugging Face base URL targets `https://router.huggingface.co/hf-inference/models`.
- The package keeps task packages provider-agnostic by exporting separate provider interfaces for classification, embeddings, QA, and summarization.
