# @moritzbrantner/document-analysis

Higher-level orchestration for document summarization, sentiment, text analysis, and question answering.

## Main APIs

- `createDocumentAnalysisPipeline({ summarization?, sentimentAnalysis?, textAnalysis?, questionAnswering?, defaultQuestions? })`
- `pipeline.analyze(input, { questions?, includeSummary?, includeSentiment?, includeTextAnalysis? })`

Inputs can be raw text, `TextDocument`s, or `OcrDocument`s. OCR inputs are converted into linguistics-aware text documents before analysis.
