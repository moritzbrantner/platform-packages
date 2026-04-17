# @moritzbrantner/document-analysis

Higher-level orchestration for document summarization, sentiment, text analysis, syntax analysis, and question answering.

## Main APIs

- `createDocumentAnalysisPipeline({ summarization?, sentimentAnalysis?, textAnalysis?, syntaxAnalysis?, questionAnswering?, defaultQuestions? })`
- `pipeline.analyze(input, { questions?, includeSummary?, includeSentiment?, includeTextAnalysis?, includeSyntax? })`

Inputs can be raw text, `TextDocument`s, or `OcrDocument`s. OCR inputs are converted into linguistics-aware text documents before analysis.
