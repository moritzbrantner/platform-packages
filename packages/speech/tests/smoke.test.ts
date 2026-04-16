import { describe, expect, test, vi } from "vitest";

import {
  collectTranscriptText,
  createBufferedStreamingSession,
  createOpenAICompatibleTranscriber,
  createWebSocketTranscriber,
  mergeTranscriptSegments,
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
            words: [
              {
                text: "Hello",
                start: 0,
                end: 0.6,
                confidence: 0.95,
              },
              {
                text: "world",
                start: 0.7,
                end: 1.4,
                confidence: 0.94,
              },
            ],
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
        words: [
          {
            text: "Hello",
            startTimeMs: 0,
            endTimeMs: 600,
            confidence: 0.95,
          },
          {
            text: "world",
            startTimeMs: 700,
            endTimeMs: 1400,
            confidence: 0.94,
          },
        ],
      }),
    ]);
    expect(result.words).toEqual([
      {
        text: "Hello",
        startTimeMs: 0,
        endTimeMs: 600,
        confidence: 0.95,
      },
      {
        text: "world",
        startTimeMs: 700,
        endTimeMs: 1400,
        confidence: 0.94,
      },
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
            words: [
              {
                text: "hello",
                start: 0,
                end: 0.3,
              },
            ],
          },
        ],
      }),
    );

    await vi.waitFor(() => {
      expect(results).toEqual([
        expect.objectContaining({
          text: "hello from websocket",
          isFinal: false,
          words: [
            {
              text: "hello",
              startTimeMs: 0,
              endTimeMs: 300,
            },
          ],
        }),
      ]);
    });

    const closePromise = session.close();
    await Promise.resolve();
    expect(JSON.parse(socket.sent.at(-1) as string)).toEqual({ type: "stop" });
    socket.close();
    await closePromise;
  });

  test("buffers chunks, reconnects, and merges interim segment revisions by id", async () => {
    const sentChunks: number[] = [];
    const emittedResults: Array<{ text: string; segmentCount: number }> = [];
    const openCallbacks: Array<() => void> = [];
    let openCount = 0;

    const transcriber = {
      async openSession(options: {
        onClose?: () => void;
        onResult: (result: {
          text: string;
          isFinal?: boolean;
          segments?: Array<{
            id: string;
            text: string;
            final: boolean;
            startTimeMs: number;
            endTimeMs: number;
          }>;
        }) => void;
      }) {
        openCount += 1;

        return {
          async sendAudioChunk(request: { chunkIndex?: number }) {
            sentChunks.push(request.chunkIndex ?? -1);

            if (request.chunkIndex === 1) {
              options.onResult({
                text: "hello",
                isFinal: false,
                segments: [
                  {
                    id: "seg-live-1",
                    text: "hello",
                    final: false,
                    startTimeMs: 0,
                    endTimeMs: 500,
                  },
                ],
              });
              options.onResult({
                text: "hello world",
                isFinal: true,
                segments: [
                  {
                    id: "seg-live-1",
                    text: "hello world",
                    final: true,
                    startTimeMs: 0,
                    endTimeMs: 900,
                  },
                ],
              });
              openCallbacks.push(() => options.onClose?.());
            }
          },
          async close() {},
        };
      },
    };

    const session = await createBufferedStreamingSession({
      transcriber,
      reconnect: { attempts: 1, delayMs: 0 },
      maxPendingChunks: 2,
      onResult(result) {
        emittedResults.push({
          text: result.text,
          segmentCount: result.segments?.length ?? 0,
        });
      },
    });

    await session.sendAudioChunk({
      audio: new Blob(["a"]),
      chunkIndex: 1,
    });
    openCallbacks[0]?.();
    await Promise.resolve();
    await session.sendAudioChunk({
      audio: new Blob(["b"]),
      chunkIndex: 2,
    });

    expect(openCount).toBe(2);
    expect(sentChunks).toEqual([1, 2]);
    expect(emittedResults.at(-1)).toEqual({
      text: "hello world",
      segmentCount: 1,
    });
    expect(
      mergeTranscriptSegments(
        [
          {
            id: "seg-live-1",
            text: "hello",
            final: false,
            startTimeMs: 0,
            endTimeMs: 500,
          },
        ],
        [
          {
            id: "seg-live-1",
            text: "hello world",
            final: true,
            startTimeMs: 0,
            endTimeMs: 900,
          },
        ],
      ),
    ).toEqual([
      {
        id: "seg-live-1",
        text: "hello world",
        final: true,
        startTimeMs: 0,
        endTimeMs: 900,
      },
    ]);

    await session.close();
  });
});
