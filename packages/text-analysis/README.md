# @moritzbrantner/text-analysis

Composable text-analysis pipeline for labels, entities, embeddings, and lightweight keyword extraction.

## Main APIs

- `createTextAnalysisPipeline({ classifier?, entityRecognizer?, embedder?, chunking?, keywordLimit? })`
- `pipeline.analyze(input, { chunking?, keywordLimit? })`

The package is intentionally modular: provide only the Hugging Face-backed sub-models you need and the pipeline will aggregate their outputs into one report.
