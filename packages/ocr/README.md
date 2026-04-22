# @moritzbrantner/ocr

`@moritzbrantner/ocr` provides a thin OCR orchestration layer for **images, PDFs, and videos**.
It is model/provider agnostic and includes utilities to convert OCR output into
`@moritzbrantner/linguistics-core` documents so downstream linguistics packages can
segment, normalize, and analyze extracted text.

## Features

- Unified request model for `image`, `pdf`, and `video` OCR inputs.
- Provider abstraction (`OcrExtractor`) so you can plug in Tesseract, cloud OCR, or custom models.
- Post-processing helpers for confidence filtering and whitespace cleanup.
- Conversion helpers to build linguistics-ready `TextDocument`s.
- Video frame-plan helper for consistent frame sampling.

## Installation

```bash
bun add @moritzbrantner/ocr
```

## Quick start

```ts
import { createOcrPipeline, normalizeOcrDocument, ocrToTextDocument } from "@moritzbrantner/ocr";

const pipeline = createOcrPipeline({
  extractor: {
    id: "my-provider",
    async extract() {
      return {
        id: "demo",
        sourceType: "image",
        pages: [
          {
            index: 0,
            blocks: [{ text: "Hallo Welt", confidence: 0.97 }],
          },
        ],
      };
    },
  },
});

const result = await pipeline.extract({ sourceType: "image", input: new Blob(["stub"]) });
const normalized = normalizeOcrDocument(result.document, { minimumConfidence: 0.8 });
const textDocument = ocrToTextDocument(normalized, { language: "de", granularity: "word" });
```
