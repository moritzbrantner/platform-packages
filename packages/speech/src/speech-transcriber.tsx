"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, TextareaHTMLAttributes } from "react";

import type {
  SpeechStreamingTranscriber,
  SpeechStreamingTranscriptionSession,
  SpeechTranscriber,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  TranscriptSegment,
} from "./transcript";
import {
  collectTranscriptText,
  mergeTranscriptSegments,
  mergeTranscriptTexts,
  normalizeTranscriptText,
} from "./transcript";

export type SpeechCaptureStatus = "idle" | "requesting-permission" | "recording" | "stopping" | "error";

export interface SpeechTranscriptChangeDetail {
  reason: "manual" | "reset" | "transcription";
  segments: TranscriptSegment[];
  lastResult?: SpeechTranscriptionResult;
}

export interface MediaDevicesLike {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
}

export interface MediaRecorderLike {
  readonly state: "inactive" | "paused" | "recording";
  readonly mimeType: string;
  addEventListener(type: "dataavailable", listener: (event: Event & { data: Blob }) => void): void;
  addEventListener(type: "stop", listener: () => void): void;
  removeEventListener(type: "dataavailable", listener: (event: Event & { data: Blob }) => void): void;
  removeEventListener(type: "stop", listener: () => void): void;
  requestData(): void;
  start(timeslice?: number): void;
  stop(): void;
}

export interface UseSpeechTranscriberOptions {
  transcriber?: SpeechTranscriber;
  streamingTranscriber?: SpeechStreamingTranscriber;
  language?: string;
  prompt?: string;
  timesliceMs?: number;
  mimeType?: string;
  audioBitsPerSecond?: number;
  audioConstraints?: MediaTrackConstraints;
  initialTranscript?: string;
  mediaDevices?: MediaDevicesLike;
  mediaRecorderFactory?: (stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorderLike;
  onTranscriptChange?: (transcript: string, detail: SpeechTranscriptChangeDetail) => void;
  onTranscriptionError?: (error: Error) => void;
}

export interface UseSpeechTranscriberResult {
  status: SpeechCaptureStatus;
  transcript: string;
  segments: TranscriptSegment[];
  error: Error | null;
  isRecording: boolean;
  isTranscribing: boolean;
  pendingRequestCount: number;
  setTranscript: (value: string) => void;
  resetTranscript: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export interface SpeechTranscriberPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange">,
    UseSpeechTranscriberOptions {
  startLabel?: string;
  stopLabel?: string;
  resetLabel?: string;
  transcriptLabel?: string;
  helperText?: string;
  unsupportedText?: string;
  showSegments?: boolean;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange">;
}

interface RecorderListeners {
  handleDataAvailable: (event: Event & { data: Blob }) => void;
  handleStop: () => void;
}

export function useSpeechTranscriber(options: UseSpeechTranscriberOptions): UseSpeechTranscriberResult {
  const [status, setStatus] = useState<SpeechCaptureStatus>("idle");
  const [transcript, setTranscriptState] = useState(options.initialTranscript ?? "");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const transcriptRef = useRef(transcript);
  const segmentsRef = useRef(segments);
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const recorderListenersRef = useRef<RecorderListeners | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);
  const sessionStartRef = useRef<number | null>(null);
  const pendingRequestCountRef = useRef(0);
  const stopResolversRef = useRef<Array<() => void>>([]);
  const errorRef = useRef<Error | null>(null);
  const streamingSessionRef = useRef<SpeechStreamingTranscriptionSession | null>(null);
  const streamingSessionPromiseRef = useRef<Promise<SpeechStreamingTranscriptionSession> | null>(
    null,
  );
  const closingStreamingSessionRef = useRef<Promise<void> | null>(null);
  const resultSequenceRef = useRef(0);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    return () => {
      cleanupRecorder();
      void closeStreamingSession();
    };
  }, []);

  function emitTranscriptChange(
    nextTranscript: string,
    detail: SpeechTranscriptChangeDetail,
  ): void {
    options.onTranscriptChange?.(nextTranscript, detail);
  }

  function applyTranscript(nextTranscript: string, detail: SpeechTranscriptChangeDetail): void {
    transcriptRef.current = nextTranscript;
    setTranscriptState(nextTranscript);
    emitTranscriptChange(nextTranscript, detail);
  }

  function applySegments(nextSegments: TranscriptSegment[]): void {
    segmentsRef.current = nextSegments;
    setSegments(nextSegments);
  }

  function setManualTranscript(value: string): void {
    setError(null);
    applyTranscript(value, {
      reason: "manual",
      segments: segmentsRef.current,
    });
  }

  function resetTranscript(): void {
    setError(null);
    applySegments([]);
    applyTranscript("", {
      reason: "reset",
      segments: [],
    });
  }

  function createRecorder(stream: MediaStream): MediaRecorderLike {
    if (options.mediaRecorderFactory) {
      return options.mediaRecorderFactory(stream, {
        mimeType: options.mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond,
      });
    }

    if (typeof globalThis.MediaRecorder !== "function") {
      throw new Error("MediaRecorder is not available in this environment.");
    }

    return new globalThis.MediaRecorder(stream, {
      mimeType: options.mimeType,
      audioBitsPerSecond: options.audioBitsPerSecond,
    });
  }

  function getMediaDevices(): MediaDevicesLike {
    if (options.mediaDevices?.getUserMedia) {
      return options.mediaDevices;
    }

    const mediaDevices = globalThis.navigator?.mediaDevices;

    if (!mediaDevices?.getUserMedia) {
      throw new Error("Microphone capture is not available in this environment.");
    }

    return mediaDevices;
  }

  function clearPendingRequests(): void {
    pendingRequestCountRef.current = 0;
    setPendingRequestCount(0);
  }

  function createRequest(blob: Blob): SpeechTranscriptionRequest {
    const chunkIndex = chunkIndexRef.current;
    chunkIndexRef.current += 1;
    const startedAt =
      sessionStartRef.current === null || !options.timesliceMs
        ? Date.now()
        : sessionStartRef.current + chunkIndex * options.timesliceMs;
    const endedAt =
      options.timesliceMs && sessionStartRef.current !== null
        ? startedAt + options.timesliceMs
        : Date.now();

    return {
      audio: blob,
      mimeType: blob.type || options.mimeType,
      language: options.language,
      prompt: options.prompt,
      chunkIndex,
      startedAt,
      endedAt,
      previousTranscript: transcriptRef.current,
    };
  }

  function resolveStopRequests(): void {
    const resolvers = stopResolversRef.current.splice(0, stopResolversRef.current.length);

    for (const resolve of resolvers) {
      resolve();
    }
  }

  function removeRecorderListeners(): void {
    const recorder = recorderRef.current;
    const listeners = recorderListenersRef.current;

    if (!recorder || !listeners) {
      return;
    }

    recorder.removeEventListener("dataavailable", listeners.handleDataAvailable);
    recorder.removeEventListener("stop", listeners.handleStop);
    recorderListenersRef.current = null;
  }

  function cleanupRecorder(): void {
    removeRecorderListeners();

    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }

    recorderRef.current = null;
    streamRef.current = null;
    sessionStartRef.current = null;
    setIsRecording(false);
  }

  function finalizeStop(nextStatus: SpeechCaptureStatus = "idle"): void {
    cleanupRecorder();
    setStatus(nextStatus);
    resolveStopRequests();
  }

  function maybeFinalizeStop(): void {
    if (recorderRef.current?.state !== "inactive") {
      return;
    }

    if (pendingRequestCountRef.current > 0) {
      return;
    }

    if (
      options.streamingTranscriber &&
      (streamingSessionRef.current || streamingSessionPromiseRef.current || closingStreamingSessionRef.current)
    ) {
      if (!closingStreamingSessionRef.current) {
        closingStreamingSessionRef.current = closeStreamingSession()
          .catch((cause) => {
            failWithError(cause);
          })
          .finally(() => {
            closingStreamingSessionRef.current = null;
            maybeFinalizeStop();
          });
      }

      return;
    }

    finalizeStop(errorRef.current ? "error" : "idle");
  }

  function failWithError(cause: unknown): void {
    const nextError = toError(cause);
    setError(nextError);
    finalizeStop("error");
    options.onTranscriptionError?.(nextError);
  }

  function applyTranscriptionResult(
    result: SpeechTranscriptionResult,
    request?: SpeechTranscriptionRequest,
  ): void {
    const normalizedSegments = normalizeResultSegments(result, request, resultSequenceRef.current);
    resultSequenceRef.current += 1;

    if (normalizedSegments.length > 0) {
      const nextSegments = mergeTranscriptSegments(segmentsRef.current, normalizedSegments);
      const nextTranscript =
        collectTranscriptText(nextSegments, {
          includeInterim: true,
        }) || mergeTranscriptTexts(transcriptRef.current, result.text);

      applySegments(nextSegments);
      applyTranscript(nextTranscript, {
        reason: "transcription",
        segments: nextSegments,
        lastResult: result,
      });
      setError(null);
      return;
    }

    const nextTranscript = mergeTranscriptTexts(transcriptRef.current, result.text);

    applyTranscript(nextTranscript, {
      reason: "transcription",
      segments: segmentsRef.current,
      lastResult: result,
    });
    setError(null);
  }

  async function ensureStreamingSession(): Promise<SpeechStreamingTranscriptionSession | null> {
    if (!options.streamingTranscriber) {
      return null;
    }

    if (streamingSessionRef.current) {
      return streamingSessionRef.current;
    }

    if (!streamingSessionPromiseRef.current) {
      streamingSessionPromiseRef.current = Promise.resolve(
        options.streamingTranscriber.openSession({
          language: options.language,
          prompt: options.prompt,
          onResult: (result) => {
            applyTranscriptionResult(result);
          },
          onError: (cause) => {
            failWithError(cause);
          },
          onClose: () => {
            streamingSessionRef.current = null;
            maybeFinalizeStop();
          },
        }),
      )
        .then((session) => {
          streamingSessionRef.current = session;
          return session;
        })
        .finally(() => {
          streamingSessionPromiseRef.current = null;
        });
    }

    return streamingSessionPromiseRef.current;
  }

  async function closeStreamingSession(): Promise<void> {
    const session =
      streamingSessionRef.current ?? (await streamingSessionPromiseRef.current?.catch(() => null));

    if (!session) {
      streamingSessionRef.current = null;
      return;
    }

    try {
      await session.close();
    } finally {
      streamingSessionRef.current = null;
    }
  }

  async function transcribeBlob(blob: Blob): Promise<void> {
    if (!blob.size) {
      return;
    }

    const request = createRequest(blob);

    pendingRequestCountRef.current += 1;
    setPendingRequestCount(pendingRequestCountRef.current);

    try {
      if (options.streamingTranscriber) {
        const session = await ensureStreamingSession();

        if (!session) {
          throw new Error("No streaming transcriber is available.");
        }

        await session.sendAudioChunk(request);
      } else if (options.transcriber) {
        const result = await options.transcriber.transcribe(request);
        applyTranscriptionResult(result, request);
      } else {
        throw new Error("No speech transcriber is configured.");
      }
    } catch (cause) {
      failWithError(cause);
      return;
    } finally {
      pendingRequestCountRef.current = Math.max(0, pendingRequestCountRef.current - 1);
      setPendingRequestCount(pendingRequestCountRef.current);
      maybeFinalizeStop();
    }
  }

  async function startRecording(): Promise<void> {
    if (recorderRef.current?.state === "recording") {
      return;
    }

    try {
      if (!options.transcriber && !options.streamingTranscriber) {
        throw new Error("No speech transcriber is configured.");
      }

      setError(null);
      setStatus("requesting-permission");
      const stream = await getMediaDevices().getUserMedia({
        audio: options.audioConstraints ?? true,
      });
      const recorder = createRecorder(stream);
      const handleDataAvailable = (event: Event & { data: Blob }) => {
        void transcribeBlob(event.data);
      };
      const handleStop = () => {
        setIsRecording(false);
        maybeFinalizeStop();
      };

      recorder.addEventListener("dataavailable", handleDataAvailable);
      recorder.addEventListener("stop", handleStop);

      recorderRef.current = recorder;
      recorderListenersRef.current = {
        handleDataAvailable,
        handleStop,
      };
      streamRef.current = stream;
      sessionStartRef.current = Date.now();
      chunkIndexRef.current = 0;
      resultSequenceRef.current = 0;
      clearPendingRequests();

      if (options.streamingTranscriber) {
        await ensureStreamingSession();
      }

      recorder.start(options.timesliceMs && options.timesliceMs > 0 ? options.timesliceMs : undefined);
      setIsRecording(true);
      setStatus("recording");
    } catch (cause) {
      failWithError(cause);
    }
  }

  async function stopRecording(): Promise<void> {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      finalizeStop(error ? "error" : "idle");
      return;
    }

    setStatus("stopping");

    const stopPromise = new Promise<void>((resolve) => {
      stopResolversRef.current.push(resolve);
    });

    recorder.requestData();
    recorder.stop();
    maybeFinalizeStop();

    await stopPromise;
  }

  return {
    status,
    transcript,
    segments,
    error,
    isRecording,
    isTranscribing: pendingRequestCount > 0,
    pendingRequestCount,
    setTranscript: setManualTranscript,
    resetTranscript,
    startRecording,
    stopRecording,
  };
}

export function SpeechTranscriberPanel({
  transcriber,
  streamingTranscriber,
  language,
  prompt,
  timesliceMs,
  mimeType,
  audioBitsPerSecond,
  audioConstraints,
  initialTranscript,
  mediaDevices,
  mediaRecorderFactory,
  onTranscriptChange,
  onTranscriptionError,
  startLabel = "Start recording",
  stopLabel = "Stop recording",
  resetLabel = "Reset transcript",
  transcriptLabel = "Transcript",
  helperText = "Chunks are uploaded while recording so a Whisper-style backend can return near-live text.",
  unsupportedText = "This browser cannot capture audio with MediaRecorder.",
  showSegments = true,
  textareaProps,
  className,
  style,
  ...divProps
}: SpeechTranscriberPanelProps) {
  const supported =
    (mediaDevices !== undefined || typeof globalThis.navigator?.mediaDevices?.getUserMedia === "function") &&
    (mediaRecorderFactory !== undefined || typeof globalThis.MediaRecorder === "function");
  const {
    status,
    transcript,
    segments,
    error,
    isRecording,
    isTranscribing,
    pendingRequestCount,
    setTranscript,
    resetTranscript,
    startRecording,
    stopRecording,
  } = useSpeechTranscriber({
    transcriber,
    streamingTranscriber,
    language,
    prompt,
    timesliceMs,
    mimeType,
    audioBitsPerSecond,
    audioConstraints,
    initialTranscript,
    mediaDevices,
    mediaRecorderFactory,
    onTranscriptChange,
    onTranscriptionError,
  });

  const isStartDisabled = !supported || isRecording || status === "requesting-permission";
  const isStopDisabled = !isRecording;

  return (
    <div
      {...divProps}
      className={className}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      <div style={styles.header}>
        <div>
          <p style={styles.title}>Speech transcription</p>
          <p style={styles.helperText}>{supported ? helperText : unsupportedText}</p>
        </div>
        <div style={styles.statusGroup}>
          <span style={styles.statusPill}>{formatStatus(status)}</span>
          {isTranscribing ? <span style={styles.pendingPill}>{pendingRequestCount} pending</span> : null}
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={() => void startRecording()} disabled={isStartDisabled} style={buttonStyle(isStartDisabled)}>
          {startLabel}
        </button>
        <button
          type="button"
          onClick={() => void stopRecording()}
          disabled={isStopDisabled}
          style={buttonStyle(isStopDisabled, true)}
        >
          {stopLabel}
        </button>
        <button type="button" onClick={resetTranscript} style={styles.secondaryButton}>
          {resetLabel}
        </button>
      </div>

      <label style={styles.label}>
        <span>{transcriptLabel}</span>
        <textarea
          {...textareaProps}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={textareaProps?.rows ?? 6}
          style={{
            ...styles.textarea,
            ...textareaProps?.style,
          }}
        />
      </label>

      {error ? <p style={styles.errorText}>{error.message}</p> : null}

      {showSegments && segments.length > 0 ? (
        <div style={styles.segmentList}>
          {segments.slice(-6).map((segment) => (
            <div key={segment.id} style={styles.segmentCard}>
              <p style={styles.segmentText}>{segment.text}</p>
              <p style={styles.segmentMeta}>
                {segment.final ? "Final" : "Interim"} · {formatTime(segment.startTimeMs)}-{formatTime(segment.endTimeMs)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function isSpeechCaptureSupported(environment: {
  navigator?: { mediaDevices?: { getUserMedia?: unknown } };
  MediaRecorder?: unknown;
} = globalThis): boolean {
  return (
    typeof environment.navigator?.mediaDevices?.getUserMedia === "function" &&
    typeof environment.MediaRecorder === "function"
  );
}

function normalizeResultSegments(
  result: SpeechTranscriptionResult,
  request: SpeechTranscriptionRequest | undefined,
  resultSequence: number,
): TranscriptSegment[] {
  if (result.segments && result.segments.length > 0) {
    return result.segments.map((segment, index) => ({
      id:
        segment.id ||
        (request
          ? `chunk-${request.chunkIndex ?? 0}-segment-${index}`
          : `stream-result-${resultSequence}-segment-${index}`),
      text: normalizeTranscriptText(segment.text),
      final: segment.final ?? result.isFinal ?? true,
      startTimeMs: segment.startTimeMs ?? request?.startedAt ?? 0,
      endTimeMs: segment.endTimeMs ?? request?.endedAt ?? request?.startedAt ?? segment.startTimeMs ?? 0,
      confidence: segment.confidence,
      chunkIndex: segment.chunkIndex ?? request?.chunkIndex,
      source: segment.source ?? (request ? "live-chunk" : "live-stream"),
    }));
  }

  const text = normalizeTranscriptText(result.text);

  if (!text) {
    return [];
  }

  return [
    {
      id: request ? `chunk-${request.chunkIndex ?? 0}` : `stream-result-${resultSequence}`,
      text,
      final: result.isFinal ?? true,
      startTimeMs: request?.startedAt ?? 0,
      endTimeMs: request?.endedAt ?? request?.startedAt ?? 0,
      chunkIndex: request?.chunkIndex,
      source: request ? "live-chunk" : "live-stream",
    },
  ];
}

function formatStatus(status: SpeechCaptureStatus): string {
  switch (status) {
    case "requesting-permission":
      return "Waiting for mic";
    case "recording":
      return "Recording";
    case "stopping":
      return "Stopping";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

function formatTime(value: number): string {
  const seconds = Math.max(0, Math.round(value / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = `${seconds % 60}`.padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function buttonStyle(disabled: boolean, danger = false): CSSProperties {
  return {
    ...styles.button,
    ...(danger ? styles.stopButton : styles.startButton),
    ...(disabled ? styles.buttonDisabled : null),
  };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

const styles = {
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  button: {
    appearance: "none",
    border: "none",
    borderRadius: "999px",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    padding: "0.75rem 1rem",
    transition: "opacity 160ms ease",
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.5,
  },
  container: {
    background: "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
    borderRadius: "1.5rem",
    color: "#e2e8f0",
    display: "grid",
    gap: "1rem",
    padding: "1.25rem",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: "0.9rem",
    margin: 0,
  },
  header: {
    alignItems: "flex-start",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
  },
  helperText: {
    color: "rgba(226,232,240,0.74)",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: "0.35rem 0 0",
    maxWidth: "42rem",
  },
  label: {
    color: "#f8fafc",
    display: "grid",
    fontSize: "0.9rem",
    fontWeight: 600,
    gap: "0.5rem",
  },
  pendingPill: {
    background: "rgba(59,130,246,0.18)",
    borderRadius: "999px",
    color: "#bfdbfe",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "0.35rem 0.7rem",
    textTransform: "uppercase",
  },
  secondaryButton: {
    appearance: "none",
    background: "rgba(148,163,184,0.18)",
    border: "1px solid rgba(148,163,184,0.25)",
    borderRadius: "999px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    padding: "0.75rem 1rem",
  },
  segmentCard: {
    background: "rgba(15,23,42,0.45)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "1rem",
    padding: "0.75rem 0.9rem",
  },
  segmentList: {
    display: "grid",
    gap: "0.75rem",
  },
  segmentMeta: {
    color: "rgba(148,163,184,0.9)",
    fontSize: "0.76rem",
    margin: "0.35rem 0 0",
  },
  segmentText: {
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: 0,
  },
  startButton: {
    background: "linear-gradient(135deg, #2563eb, #0891b2)",
  },
  statusGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
  },
  statusPill: {
    background: "rgba(148,163,184,0.18)",
    borderRadius: "999px",
    color: "#f8fafc",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "0.35rem 0.7rem",
    textTransform: "uppercase",
  },
  stopButton: {
    background: "linear-gradient(135deg, #dc2626, #f97316)",
  },
  textarea: {
    background: "rgba(15,23,42,0.54)",
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: "1rem",
    color: "#f8fafc",
    fontFamily:
      '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "0.98rem",
    lineHeight: 1.6,
    minHeight: "9rem",
    outline: "none",
    padding: "0.95rem 1rem",
    resize: "vertical",
    width: "100%",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;
