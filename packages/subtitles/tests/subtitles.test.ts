import { describe, expect, test } from "vitest";

import {
  collectTimedTextText,
  detectCueOverlaps,
  detectTimedTextFormat,
  fromTranscriptSegments,
  insertTimedTextCue,
  parseSrt,
  parseTimedText,
  parseTranscriptJson,
  parseVtt,
  removeTimedTextCue,
  serializeSrt,
  serializeTimedText,
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
