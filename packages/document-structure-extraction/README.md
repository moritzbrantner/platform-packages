# @moritzbrantner/document-structure-extraction

Structure extraction primitives for OCR documents with support for:

- non-linear reading order estimation with bounding box metadata,
- table grid extraction,
- header/value pair detection,
- section hierarchy detection,
- flattening helpers for CSV/JSON-style rows and form fields,
- traceable mappings from structured blocks into `TextDocument` spans,
- optional integration hooks for downstream pipelines (e.g. `document-analysis`).

## Main APIs

- `extractDocumentStructure(ocrDocument, options?)`
- `flattenStructuredDocument(structuredDocument)`
- `toFormFieldRecords(structuredDocument)`
- `mapStructureToTextDocumentSpans(structuredDocument, options?)`
- `runStructureIntegrationHooks(ocrDocument, structuredDocument, hooks?)`
