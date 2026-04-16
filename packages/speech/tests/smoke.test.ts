import { describe, expect, test, vi } from "vitest";

import {
  collectTranscriptText,
  createOpenAICompatibleTranscriber,
  createWebSocketTranscriber,
  mergeTranscriptTexts,
  transcriptToPhrases,
} from "@moritzbrantner/speech";

class MockWebSocket {
  readyState = 0;
  binaryType: BinaryType = "blob";
  sent: Array<string | Blob | ArrayBuffer | ArrayBufferView> = [];
  private closeListeners = new Set<() => void>();
  private errorListeners = new Set<() => void>();
  private messageListeners = new Set<(event: { data: unknown }) => void>();
  private openListeners = new Set<() => void>();

  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (() => void) | ((event: { data: unknown }) => void),
  ) {
    if (type === "open") {
      this.openListeners.add(listener as () => void);
      return;
    }

    if (type === "message") {
      this.messageListeners.add(listener as (event: { data: unknown }) => void);
      return;
    }

    if (type === "error") {
      this.errorListeners.add(listener as () => void);
      return;
    }

    this.closeListeners.add(listener as () => void);
  }

  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (() => void) | ((event: { data: unknown }) => void),
  ) {
    if (type === "open") {
      this.openListeners.delete(listener as () => void);
      return;
    }

    if (type === "message") {
      this.messageListeners.delete(listener as (event: { data: unknown }) => void);
      return;
    }

    if (type === "error") {
      this.errorListeners.delete(listener as () => void);
      return;
    }

    this.closeListeners.delete(listener as () => void);
  }

  send(data: string | Blob | ArrayBuffer | ArrayBufferView) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;

    for (const listener of this.closeListeners) {
      listener();
    }
  }

  emitOpen() {
    this.readyState = 1;

    for (const listener of this.openListeners) {
      listener();
    }
  }

  emitMessage(data: unknown) {
    for (const listener of this.messageListeners) {
      listener({ data });
    }
  }
}

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

  test("opens a websocket session, sends chunk messages, and maps transcript events", async () => {
    const socket = new MockWebSocket();
    const results: Array<{ text: string; isFinal?: boolean }> = [];
    const transcriber = createWebSocketTranscriber({
      url: "wss://example.com/transcribe",
      model: "whisper-live",
      webSocketFactory: () => socket,
    });
    const sessionPromise = transcriber.openSession({
      language: "en",
      onResult: (result) => {
        results.push(result);
      },
    });

    socket.emitOpen();

    const session = await sessionPromise;
    expect(JSON.parse(socket.sent[0] as string)).toMatchObject({
      type: "start",
      model: "whisper-live",
      language: "en",
    });

    await session.sendAudioChunk({
      audio: new Blob(["hi"], { type: "audio/webm" }),
      mimeType: "audio/webm",
      chunkIndex: 1,
      language: "en",
    });

    expect(JSON.parse(socket.sent[1] as string)).toMatchObject({
      type: "audio_chunk",
      model: "whisper-live",
      chunkIndex: 1,
      language: "en",
      audio: "aGk=",
    });

    socket.emitMessage(
      JSON.stringify({
        text: "hello from websocket",
        isFinal: false,
        segments: [
          {
            id: "seg-live-1",
            text: "hello from websocket",
            start: 0,
            end: 0.9,
            final: false,
          },
        ],
      }),
    );

    await vi.waitFor(() => {
      expect(results).toEqual([
        expect.objectContaining({
          text: "hello from websocket",
          isFinal: false,
        }),
      ]);
    });

    const closePromise = session.close();
    await Promise.resolve();
    expect(JSON.parse(socket.sent.at(-1) as string)).toEqual({ type: "stop" });
    socket.close();
    await closePromise;
  });
});
