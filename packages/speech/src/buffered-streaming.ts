import {
  collectTranscriptText,
  mergeTranscriptSegments,
  type SpeechStreamingSessionOptions,
  type SpeechStreamingTranscriber,
  type SpeechStreamingTranscriptionSession,
  type SpeechTranscriptionRequest,
  type SpeechTranscriptionResult,
  type TranscriptSegment,
  type TranscriptWord,
} from "./transcript";

export interface BufferedStreamingReconnectOptions {
  attempts?: number;
  delayMs?: number;
}

export interface CreateBufferedStreamingSessionOptions
  extends Omit<SpeechStreamingSessionOptions, "onClose" | "onResult"> {
  transcriber: SpeechStreamingTranscriber;
  onClose?: () => void;
  onResult: (result: SpeechTranscriptionResult) => void;
  maxPendingChunks?: number;
  dropInterimAfterMs?: number;
  reconnect?: boolean | BufferedStreamingReconnectOptions;
}

interface PendingChunk {
  reject: (error: Error) => void;
  request: SpeechTranscriptionRequest;
  resolve: () => void;
}

const DEFAULT_MAX_PENDING_CHUNKS = 4;

export async function createBufferedStreamingSession(
  options: CreateBufferedStreamingSessionOptions,
): Promise<SpeechStreamingTranscriptionSession> {
  const reconnectOptions = normalizeReconnect(options.reconnect);
  const pending: PendingChunk[] = [];
  const interimUpdatedAt = new Map<string, number>();
  let attempts = 0;
  let closed = false;
  let flushing = false;
  let intentionalClose = false;
  let mergedSegments: TranscriptSegment[] = [];
  let session: SpeechStreamingTranscriptionSession | null = null;
  let sessionPromise: Promise<SpeechStreamingTranscriptionSession> | null = null;

  const sessionOptions: SpeechStreamingSessionOptions = {
    language: options.language,
    prompt: options.prompt,
    signal: options.signal,
    metadata: options.metadata,
    onError: options.onError,
    onClose: () => {
      session = null;
      sessionPromise = null;

      if (closed || intentionalClose) {
        options.onClose?.();
        return;
      }

      if (!canReconnect(reconnectOptions, attempts)) {
        options.onClose?.();
        return;
      }

      attempts += 1;
      void reopenAfterDelay(reconnectOptions?.delayMs ?? 0);
    },
    onResult: (result) => {
      mergedSegments = updateSegments(
        mergedSegments,
        result.segments,
        interimUpdatedAt,
        options.dropInterimAfterMs,
      );

      const words = collectWords(result.words, mergedSegments);
      options.onResult({
        ...result,
        segments: mergedSegments.length > 0 ? mergedSegments.map(copySegment) : result.segments,
        words,
        text:
          mergedSegments.length > 0
            ? collectTranscriptText(mergedSegments, { includeInterim: true })
            : result.text,
      });
    },
  };

  await ensureSession();

  return {
    async sendAudioChunk(request) {
      if (closed) {
        throw new Error("Buffered streaming session is closed.");
      }

      await new Promise<void>((resolve, reject) => {
        pending.push({ request, resolve, reject });

        while (pending.length > Math.max(1, options.maxPendingChunks ?? DEFAULT_MAX_PENDING_CHUNKS)) {
          pending.shift()?.resolve();
        }

        void flush();
      });
    },
    async close() {
      closed = true;
      intentionalClose = true;

      while (pending.length > 0) {
        pending.shift()?.resolve();
      }

      if (sessionPromise) {
        const activeSession = await sessionPromise;
        await activeSession.close();
      }
    },
  };

  async function ensureSession(): Promise<SpeechStreamingTranscriptionSession> {
    if (session) {
      return session;
    }

    if (!sessionPromise) {
      sessionPromise = Promise.resolve(options.transcriber.openSession(sessionOptions)).then(
        (openedSession) => {
          session = openedSession;
          void flush();
          return openedSession;
        },
      );
    }

    return sessionPromise;
  }

  async function flush(): Promise<void> {
    if (flushing || closed) {
      return;
    }

    flushing = true;

    try {
      while (pending.length > 0 && !closed) {
        const next = pending[0];
        const activeSession = await ensureSession();

        try {
          await activeSession.sendAudioChunk(next.request);
          pending.shift();
          next.resolve();
        } catch (error) {
          if (canReconnect(reconnectOptions, attempts)) {
            attempts += 1;
            session = null;
            sessionPromise = null;
            await reopenAfterDelay(reconnectOptions?.delayMs ?? 0);
            continue;
          }

          pending.shift();
          next.reject(toError(error));
        }
      }
    } finally {
      flushing = false;
    }
  }

  async function reopenAfterDelay(delayMs: number): Promise<void> {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    if (!closed) {
      await ensureSession();
      await flush();
    }
  }
}

function normalizeReconnect(
  reconnect: CreateBufferedStreamingSessionOptions["reconnect"],
): Required<BufferedStreamingReconnectOptions> | null {
  if (!reconnect) {
    return null;
  }

  if (reconnect === true) {
    return {
      attempts: 1,
      delayMs: 0,
    };
  }

  return {
    attempts: reconnect.attempts ?? 1,
    delayMs: reconnect.delayMs ?? 0,
  };
}

function canReconnect(
  reconnect: Required<BufferedStreamingReconnectOptions> | null,
  attempts: number,
): boolean {
  return reconnect !== null && attempts < reconnect.attempts;
}

function updateSegments(
  existingSegments: TranscriptSegment[],
  incomingSegments: TranscriptSegment[] | undefined,
  interimUpdatedAt: Map<string, number>,
  dropInterimAfterMs: number | undefined,
): TranscriptSegment[] {
  if (!incomingSegments || incomingSegments.length === 0) {
    return existingSegments.map(copySegment);
  }

  const now = Date.now();

  for (const segment of incomingSegments) {
    if (segment.final) {
      interimUpdatedAt.delete(segment.id);
      continue;
    }

    interimUpdatedAt.set(segment.id, now);
  }

  const merged = mergeTranscriptSegments(
    existingSegments,
    incomingSegments.map(copySegment),
  ).map(copySegment);

  if (dropInterimAfterMs === undefined) {
    return merged;
  }

  return merged.filter((segment) => {
    if (segment.final) {
      return true;
    }

    return now - (interimUpdatedAt.get(segment.id) ?? now) <= dropInterimAfterMs;
  });
}

function collectWords(
  words: TranscriptWord[] | undefined,
  segments: TranscriptSegment[],
): TranscriptWord[] | undefined {
  if (words && words.length > 0) {
    return words.map((word) => ({ ...word }));
  }

  const aggregated = segments.flatMap((segment) => segment.words ?? []);
  return aggregated.length > 0 ? aggregated.map((word) => ({ ...word })) : undefined;
}

function copySegment(segment: TranscriptSegment): TranscriptSegment {
  return {
    ...segment,
    words: segment.words?.map((word) => ({ ...word })),
  };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
