import { describe, expect, test } from "vitest";

import {
  collectTimedTextText,
  detectCueOverlaps,
  detectTimedTextFormat,
  fromTranscriptSegments,
  insertTimedTextCue,
  parseAss,
  parseSrt,
  parseTimedText,
  parseTranscriptJson,
  parseVtt,
  parseYoutube,
  removeTimedTextCue,
  serializeAss,
  serializeSrt,
  serializeTimedText,
  serializeYoutube,
  shiftTimedText,
  toTranscriptSegments,
  updateTimedTextCue,
  validateTimedTextDocument,
} from "@moritzbrantner/subtitles";

describe("@moritzbrantner/subtitles", () => {
  test("parses and serializes SRT documents", () => {
    const document = parseSrt(`1
00:00:01,000 --> 00:00:02,500
Hello there

2
00:00:03,000 --> 00:00:04,200
General Kenobi
`);

    expect(document).toMatchObject({
      format: "srt",
      cues: [
        {
          id: "cue-1",
          startTimeMs: 1000,
          endTimeMs: 2500,
          text: "Hello there",
        },
        {
          id: "cue-2",
          startTimeMs: 3000,
          endTimeMs: 4200,
          text: "General Kenobi",
        },
      ],
    });

    expect(serializeSrt(document)).toBe(`1
00:00:01,000 --> 00:00:02,500
Hello there

2
00:00:03,000 --> 00:00:04,200
General Kenobi
`);
  });

  test("parses VTT documents with identifiers and ignores NOTE blocks", () => {
    const document = parseVtt(`WEBVTT

NOTE this block should be ignored

greeting
00:00:01.000 --> 00:00:02.500 align:start position:50%
Hello there

00:00:03.000 --> 00:00:04.200
General Kenobi
`);

    expect(document.cues).toEqual([
      expect.objectContaining({
        id: "greeting",
        startTimeMs: 1000,
        endTimeMs: 2500,
        text: "Hello there",
        settings: {
          align: "start",
          position: "50%",
        },
      }),
      expect.objectContaining({
        id: "cue-2",
        startTimeMs: 3000,
        endTimeMs: 4200,
        text: "General Kenobi",
      }),
    ]);

    expect(serializeTimedText(document, { format: "vtt" })).toContain(
      "00:00:01.000 --> 00:00:02.500 align:start position:50%",
    );
  });

  test("parses and serializes ASS documents with style metadata", () => {
    const input = `[Script Info]
Title: Demo captions
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, BackColour, Bold, Italic, Underline, Alignment, MarginL, MarginR, MarginV
Style: Default,Arial,42,&H00FFFFFF,&H96000000,0,0,0,2,0000,0000,0040
Style: Top,Arial,36,&H0000FFFF,&H96000000,-1,0,0,8,0020,0020,0030

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.25,Top,Narrator,0000,0000,0030,,{\\an8}Hello\\Nthere
`;

    expect(detectTimedTextFormat(input, "captions.ass")).toBe("ass");

    const document = parseAss(input);

    expect(document).toMatchObject({
      format: "ass",
      cues: [
        {
          startTimeMs: 1000,
          endTimeMs: 3250,
          text: "Hello\nthere",
          settings: {
            "ass-style": "Top",
            "ass-name": "Narrator",
            "ass-alignment": "8",
            "ass-font": "Arial",
            "ass-font-size": "36",
          },
        },
      ],
    });

    expect(serializeAss(document)).toContain("Dialogue: 0,0:00:01.00,0:00:03.25,Top,Narrator");
    expect(serializeTimedText(document, { format: "ass" })).toContain("Hello\\Nthere");
  });

  test("parses and serializes YouTube SBV captions", () => {
    const input = `0:00:01.000,0:00:02.500
Hello there

0:00:03.000,0:00:04.200
General Kenobi
`;

    expect(detectTimedTextFormat(input, "captions.sbv")).toBe("youtube");

    const document = parseYoutube(input);

    expect(document).toMatchObject({
      format: "youtube",
      cues: [
        {
          startTimeMs: 1000,
          endTimeMs: 2500,
          text: "Hello there",
        },
        {
          startTimeMs: 3000,
          endTimeMs: 4200,
          text: "General Kenobi",
        },
      ],
    });

    expect(serializeYoutube(document)).toBe(input);
    expect(serializeTimedText(document, { format: "youtube" })).toBe(input);
  });

  test("parses YouTube timedtext XML captions", () => {
    const document = parseTimedText(
      `<transcript><text start="1.2" dur="2.3">Hello &amp; welcome</text><text start="4" dur="1">Next&lt;br&gt;line</text></transcript>`,
      {
        fileName: "captions.xml",
        format: "youtube",
      },
    );

    expect(document).toMatchObject({
      format: "youtube",
      cues: [
        {
          startTimeMs: 1200,
          endTimeMs: 3500,
          text: "Hello & welcome",
        },
        {
          startTimeMs: 4000,
          endTimeMs: 5000,
          text: "Next\nline",
        },
      ],
    });
  });

  test("parses transcript JSON files and supports generic format detection", () => {
    const input = JSON.stringify({
      language: "en",
      segments: [
        {
          id: "seg-1",
          start: 0,
          end: 1.25,
          text: "Hello there",
          speaker: "Speaker A",
          confidence: 0.91,
          final: true,
          words: [
            {
              text: "Hello",
              start: 0,
              end: 0.4,
            },
            {
              text: "there",
              startTimeMs: 500,
              endTimeMs: 900,
            },
          ],
        },
      ],
    });

    expect(detectTimedTextFormat(input, "meeting.json")).toBe("transcript-json");

    const document = parseTimedText(input, {
      fileName: "meeting.json",
    });

    expect(document).toMatchObject({
      format: "transcript-json",
      language: "en",
      cues: [
        {
          id: "seg-1",
          startTimeMs: 0,
          endTimeMs: 1250,
          text: "Hello there",
          speaker: "Speaker A",
          confidence: 0.91,
          final: true,
          words: [
            {
              text: "Hello",
              startTimeMs: 0,
              endTimeMs: 400,
            },
            {
              text: "there",
              startTimeMs: 500,
              endTimeMs: 900,
            },
          ],
        },
      ],
    });

    expect(parseTranscriptJson(input)).toEqual(document);
    expect(serializeTimedText(document)).toContain(`"format": "transcript-json"`);
    expect(serializeTimedText(document)).toContain(`"words"`);
  });

  test("supports editing timed text cues and converting transcript segments", () => {
    const initial = fromTranscriptSegments([
      {
        id: "seg-1",
        startTimeMs: 500,
        endTimeMs: 1500,
        text: "Hello there",
        speaker: "A",
      },
      {
        id: "seg-2",
        startTimeMs: 2000,
        endTimeMs: 3000,
        text: "General Kenobi",
        speaker: "B",
      },
    ]);

    const inserted = insertTimedTextCue(
      initial,
      {
        startTimeMs: 1500,
        endTimeMs: 1900,
        text: "pause",
      },
      1,
    );
    const updated = updateTimedTextCue(inserted, "cue-3", {
      text: "brief pause",
    });
    const shifted = shiftTimedText(updated, -1000, {
      targets: ["seg-1"],
    });
    const cleaned = removeTimedTextCue(shifted, "seg-2");

    expect(cleaned.cues).toEqual([
      expect.objectContaining({
        id: "seg-1",
        startTimeMs: 0,
        endTimeMs: 1000,
        text: "Hello there",
      }),
      expect.objectContaining({
        id: "cue-3",
        startTimeMs: 1500,
        endTimeMs: 1900,
        text: "brief pause",
      }),
    ]);

    expect(collectTimedTextText(cleaned, { includeSpeakerLabels: true })).toBe(
      "A: Hello there\nbrief pause",
    );
    expect(toTranscriptSegments(cleaned)).toEqual(cleaned.cues);
  });

  test("detects overlaps and validation issues without mutating the document", () => {
    const document = fromTranscriptSegments([
      {
        id: "seg-1",
        startTimeMs: 0,
        endTimeMs: 1000,
        text: "Hello there",
        words: [
          {
            text: "Hello",
            startTimeMs: 0,
            endTimeMs: 500,
          },
          {
            text: "there",
            startTimeMs: 900,
            endTimeMs: 1200,
          },
        ],
      },
      {
        id: "seg-2",
        startTimeMs: 800,
        endTimeMs: 1500,
        text: "General Kenobi",
      },
    ]);

    expect(detectCueOverlaps(document)).toEqual([
      {
        firstCueId: "seg-1",
        secondCueId: "seg-2",
        overlapMs: 200,
      },
    ]);
    expect(validateTimedTextDocument(document)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "cue-overlap",
          cueId: "seg-1",
          relatedCueId: "seg-2",
        }),
        expect.objectContaining({
          code: "word-outside-cue",
          cueId: "seg-1",
        }),
      ]),
    );
    expect(document.cues[0]?.words?.[1]?.endTimeMs).toBe(1200);
  });
});
