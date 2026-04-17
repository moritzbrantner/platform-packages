# @moritzbrantner/document-analysis

Higher-level orchestration for document summarization, sentiment, text analysis, and question answering.

## Main APIs

- `createDocumentAnalysisPipeline({ summarization?, sentimentAnalysis?, textAnalysis?, questionAnswering?, structureHooks?, defaultQuestions? })`
- `pipeline.analyze(input, { questions?, includeSummary?, includeSentiment?, includeTextAnalysis?, includeStructure? })`

Inputs can be raw text, `TextDocument`s, or `OcrDocument`s.

When OCR input is used, the pipeline can optionally include structure-aware extraction through `@moritzbrantner/document-structure-extraction` and run `structureHooks` to return structured findings and metadata.
