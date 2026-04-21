# @moritzbrantner/subtitles

Timed-text parsing, editing, validation, overlap detection, and roundtripping for ASS/SSA, SRT, WebVTT, YouTube SBV/XML, and transcript JSON.

## Main APIs

- `parseTimedText(input, { format?, fileName? })`
- `serializeTimedText(document, { format? })`
- `normalizeTimedTextDocument(document)`
- `detectCueOverlaps(document)` / `validateTimedTextDocument(document)`

## Example

```ts
import {
  detectCueOverlaps,
  parseAss,
  serializeTimedText,
} from "@moritzbrantner/subtitles";

const document = parseAss(`[Script Info]
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0000,0000,0000,,Hello there
`);

detectCueOverlaps(document);
serializeTimedText(document, { format: "ass" });
```
