# @moritzbrantner/subtitles

Timed-text parsing, editing, validation, overlap detection, and roundtripping for SRT, WebVTT, and transcript JSON.

## Main APIs

- `parseTimedText(input, { format?, fileName? })`
- `serializeTimedText(document, { format? })`
- `normalizeTimedTextDocument(document)`
- `detectCueOverlaps(document)` / `validateTimedTextDocument(document)`

## Example

```ts
import {
  detectCueOverlaps,
  parseVtt,
  serializeTimedText,
} from "@moritzbrantner/subtitles";

const document = parseVtt(`WEBVTT

intro
00:00:01.000 --> 00:00:02.000 align:start
Hello there
`);

detectCueOverlaps(document);
serializeTimedText(document, { format: "vtt" });
```
