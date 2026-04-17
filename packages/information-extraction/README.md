# @moritzbrantner/information-extraction

Extracts schema-ready triples/quads and event frames from long text with span anchors, confidence scores, and cross-chunk merging.

## Main APIs

- `createInformationExtractionPipeline({ relationProvider?, eventProvider?, entityRecognizer?, chunking?, merge? })`
- `pipeline.extract(input, { analysis?, emitGraph? })`
- `toGraphJson(result)`

## Notes

- Uses `text-analysis` entities when provided via `analysis` for best quality.
- Works standalone by calling `text-inference` token classification providers.
- Emits graph-ready JSON with nodes, edges, and event nodes for downstream pipelines.
