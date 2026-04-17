# @moritzbrantner/sentiment-analysis

Sentiment analysis with canonical score normalization on top of text-classification models.

## Main APIs

- `createSentimentAnalysisPipeline({ provider, model, chunking?, labelMap? })`
- `pipeline.analyze(input, { chunking?, labelMap? })`

The package accepts arbitrary model labels and maps them into `positive`, `negative`, `neutral`, and `mixed` sentiment buckets.
