import { describe, expect, test, vi } from "vitest";

import {
  collectTranscriptText,
  createOpenAICompatibleTranscriber,
  mergeTranscriptTexts,
  transcriptToPhrases,
} from "@moritzbrantner/speech";

describe("@moritzbrantner/speech utilities", () => {
  test("merges overlapping chunk transcripts without duplicating repeated words", () => {
    expect(mergeTranscriptTexts("hello there general", "general kenobi")).toBe(
      "hello there general kenobi",
    );
    expect(mergeTranscriptTexts("hello there", "hello there from speech")).toBe(
      "hello there from speech",
    );
  });

  test("collects final transcript text from segments and splits it into training phrases", () => {
    const transcript = collectTranscriptText([
      {
        id: "segment-1",
        text: "Hello there.",
        final: true,
        startTimeMs: 0,
        endTimeMs: 1200,
      },
      {
        id: "segment-2",
        text: "How are you today?",
        final: true,
        startTimeMs: 1200,
        endTimeMs: 2400,
      },
    ]);

    expect(transcript).toBe("Hello there. How are you today?");
    expect(transcriptToPhrases(transcript)).toEqual(["Hello there.", "How are you today?"]);
  });

  test("posts audio to an OpenAI-compatible endpoint and normalizes the response", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer secret-token");

      const body = init?.body as FormData;
      const file = body.get("file") as File;

      expect(body.get("model")).toBe("whisper-1");
      expect(body.get("language")).toBe("en");
      expect(file.name).toBe("audio-chunk-2.webm");

      return new Response(
        JSON.stringify({
          text: "Hello world from whisper",
          language: "en",
          segments: [
            {
              id: "seg-1",
              text: "Hello world from whisper",
              start: 0,
              end: 1.4,
              confidence: 0.91,
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });
    const transcriber = createOpenAICompatibleTranscriber({
      endpoint: "https://example.com/audio/transcriptions",
      model: "whisper-1",
      apiKey: "secret-token",
      fetch,
    });

    const result = await transcriber.transcribe({
      audio: new Blob(["audio"], { type: "audio/webm" }),
      language: "en",
      chunkIndex: 2,
    });

    expect(result).toMatchObject({
      text: "Hello world from whisper",
      language: "en",
      isFinal: true,
    });
    expect(result.segments).toEqual([
      expect.objectContaining({
        id: "seg-1",
        text: "Hello world from whisper",
        startTimeMs: 0,
        endTimeMs: 1400,
        confidence: 0.91,
      }),
    ]);
  });
});
