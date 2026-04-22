import type {
  NormalizeTimedTextDocumentOptions,
  ShiftTimedTextOptions,
  TimedTextCue,
  TimedTextDocument,
  TimedTextOverlap,
  TimedTextValidationIssue,
  TranscriptSegmentLike,
} from "./model";

export function normalizeTimedTextDocument(
  document: TimedTextDocument,
  options: NormalizeTimedTextDocumentOptions = {},
): TimedTextDocument {
  const cues = document.cues.map((cue, index) => normalizeCue(cue, index, options.clampToZero));

  if (options.sort !== false) {
    cues.sort(
      (left, right) =>
        left.startTimeMs - right.startTimeMs ||
        left.endTimeMs - right.endTimeMs ||
        left.id.localeCompare(right.id),
    );
  }

  return {
    ...document,
    cues,
  };
}

export function updateTimedTextCue(
  document: TimedTextDocument,
  target: number | string,
  patch: Partial<Omit<TimedTextCue, "id">>,
): TimedTextDocument {
  const index = resolveCueIndex(document, target);

  if (index === -1) {
    throw new Error(`Timed text cue not found: ${String(target)}`);
  }

  const cues = document.cues.map((cue, cueIndex) =>
    cueIndex === index ? normalizeCue({ ...cue, ...patch, id: cue.id }, cueIndex) : copyCue(cue),
  );

  return {
    ...document,
    cues,
  };
}

export function insertTimedTextCue(
  document: TimedTextDocument,
  cue: Omit<Partial<TimedTextCue>, "id"> &
    Pick<TimedTextCue, "endTimeMs" | "startTimeMs" | "text"> & {
      id?: string;
    },
  index = document.cues.length,
): TimedTextDocument {
  const nextIndex = Math.max(0, Math.min(index, document.cues.length));
  const existingIds = new Set(document.cues.map((entry) => entry.id));
  const cues = document.cues.map((entry) => copyCue(entry));
  const id = createCueId(cue.id, existingIds, cues.length);

  cues.splice(
    nextIndex,
    0,
    normalizeCue(
      {
        ...cue,
        id,
      },
      nextIndex,
    ),
  );

  return {
    ...document,
    cues,
  };
}

export function removeTimedTextCue(
  document: TimedTextDocument,
  target: number | string,
): TimedTextDocument {
  const index = resolveCueIndex(document, target);

  if (index === -1) {
    throw new Error(`Timed text cue not found: ${String(target)}`);
  }

  return {
    ...document,
    cues: document.cues.filter((_, cueIndex) => cueIndex !== index).map((cue) => copyCue(cue)),
  };
}

export function mapTimedTextCues(
  document: TimedTextDocument,
  mapper: (cue: TimedTextCue, index: number) => TimedTextCue,
): TimedTextDocument {
  const cues = document.cues.map((cue, index) => normalizeCue(mapper(copyCue(cue), index), index));

  return {
    ...document,
    cues,
  };
}

export function shiftTimedText(
  document: TimedTextDocument,
  offsetMs: number,
  options: ShiftTimedTextOptions = {},
): TimedTextDocument {
  const targets = options.targets ? new Set(options.targets) : undefined;
  const cues = document.cues.map((cue, index) => {
    if (targets && !targets.has(index) && !targets.has(cue.id)) {
      return copyCue(cue);
    }

    let startTimeMs = cue.startTimeMs + offsetMs;
    let endTimeMs = cue.endTimeMs + offsetMs;

    if (options.clampToZero !== false && startTimeMs < 0) {
      endTimeMs = Math.max(0, endTimeMs - startTimeMs);
      startTimeMs = 0;
    }

    return normalizeCue(
      {
        ...cue,
        startTimeMs,
        endTimeMs,
      },
      index,
      options.clampToZero,
    );
  });

  return {
    ...document,
    cues,
  };
}

export function collectTimedTextText(
  document: TimedTextDocument,
  options: {
    includeSpeakerLabels?: boolean;
    separator?: string;
  } = {},
): string {
  return document.cues
    .map((cue) => {
      if (options.includeSpeakerLabels && cue.speaker) {
        return `${cue.speaker}: ${cue.text}`;
      }

      return cue.text;
    })
    .filter(Boolean)
    .join(options.separator ?? "\n");
}

export function fromTranscriptSegments(
  segments: Iterable<TranscriptSegmentLike>,
  options: Omit<TimedTextDocument, "cues" | "format"> & {
    format?: TimedTextDocument["format"];
  } = {},
): TimedTextDocument {
  return normalizeTimedTextDocument({
    format: options.format ?? "transcript-json",
    language: options.language,
    text: options.text,
    metadata: options.metadata,
    cues: Array.from(segments, (segment, index) => normalizeCue(segment, index)),
  });
}

export function toTranscriptSegments(document: TimedTextDocument): TranscriptSegmentLike[] {
  return document.cues.map((cue) => copyCue(cue));
}

export function detectCueOverlaps(document: TimedTextDocument): TimedTextOverlap[] {
  const cues = normalizeTimedTextDocument(document).cues;
  const overlaps: TimedTextOverlap[] = [];

  for (let index = 1; index < cues.length; index += 1) {
    const previous = cues[index - 1];
    const current = cues[index];

    if (previous.endTimeMs <= current.startTimeMs) {
      continue;
    }

    overlaps.push({
      firstCueId: previous.id,
      secondCueId: current.id,
      overlapMs: previous.endTimeMs - current.startTimeMs,
    });
  }

  return overlaps;
}

export function validateTimedTextDocument(document: TimedTextDocument): TimedTextValidationIssue[] {
  const issues: TimedTextValidationIssue[] = [];

  for (const cue of document.cues) {
    if (cue.endTimeMs < cue.startTimeMs) {
      issues.push({
        code: "invalid-cue-range",
        cueId: cue.id,
        message: `Cue ${cue.id} ends before it starts.`,
      });
    }

    for (const word of cue.words ?? []) {
      if (word.startTimeMs < cue.startTimeMs || word.endTimeMs > cue.endTimeMs) {
        issues.push({
          code: "word-outside-cue",
          cueId: cue.id,
          message: `Word timing for cue ${cue.id} falls outside the cue range.`,
        });
      }
    }
  }

  for (const overlap of detectCueOverlaps(document)) {
    issues.push({
      code: "cue-overlap",
      cueId: overlap.firstCueId,
      relatedCueId: overlap.secondCueId,
      message: `Cue ${overlap.firstCueId} overlaps cue ${overlap.secondCueId} by ${overlap.overlapMs}ms.`,
    });
  }

  return issues;
}

function normalizeCue(
  cue: Partial<TimedTextCue> & Pick<TimedTextCue, "endTimeMs" | "startTimeMs" | "text">,
  index: number,
  clampToZero = true,
): TimedTextCue {
  const startTimeMs = clampToZero
    ? Math.max(0, Math.round(cue.startTimeMs))
    : Math.round(cue.startTimeMs);
  const endTimeMs = Math.max(startTimeMs, Math.round(cue.endTimeMs));

  return {
    id: cue.id?.trim() || `cue-${index + 1}`,
    startTimeMs,
    endTimeMs,
    text: cue.text,
    speaker: cue.speaker,
    confidence: cue.confidence,
    final: cue.final,
    language: cue.language,
    metadata: cue.metadata ? { ...cue.metadata } : undefined,
    settings: cue.settings ? { ...cue.settings } : undefined,
    words: cue.words
      ? cue.words.map((word) => ({
          text: word.text,
          startTimeMs: Math.round(word.startTimeMs),
          endTimeMs: Math.max(Math.round(word.startTimeMs), Math.round(word.endTimeMs)),
          confidence: word.confidence,
        }))
      : undefined,
  };
}

function resolveCueIndex(document: TimedTextDocument, target: number | string): number {
  return typeof target === "number" ? target : document.cues.findIndex((cue) => cue.id === target);
}

function copyCue(cue: TimedTextCue): TimedTextCue {
  return {
    ...cue,
    metadata: cue.metadata ? { ...cue.metadata } : undefined,
    settings: cue.settings ? { ...cue.settings } : undefined,
    words: cue.words?.map((word) => ({ ...word })),
  };
}

function createCueId(
  candidate: string | undefined,
  existingIds: Set<string>,
  cueCount: number,
): string {
  if (candidate && !existingIds.has(candidate)) {
    return candidate;
  }

  let index = cueCount + 1;

  while (existingIds.has(`cue-${index}`)) {
    index += 1;
  }

  return `cue-${index}`;
}
