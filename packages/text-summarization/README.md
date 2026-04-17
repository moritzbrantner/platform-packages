# @moritzbrantner/text-summarization

Chunk-aware text summarization pipeline for Hugging Face-style summarization models.

## Main APIs

- `createTextSummarizationPipeline({ provider, model, reducerModel?, chunking?, maxPasses? })`
- `pipeline.summarize(input, { chunking?, maxPasses? })`

Longer inputs are split with `@moritzbrantner/text-inference`, summarized chunk-by-chunk, and optionally reduced over multiple passes.
