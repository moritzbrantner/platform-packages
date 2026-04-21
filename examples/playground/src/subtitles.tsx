import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import {
  collectTimedTextText,
  detectCueOverlaps,
  parseTimedText,
  serializeTimedText,
  validateTimedTextDocument,
  type TimedTextCue,
  type TimedTextDocument,
  type TimedTextFormat,
} from "@moritzbrantner/subtitles";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

type SubtitleSample = {
  format: TimedTextFormat;
  label: string;
  fileName: string;
  source: string;
};

const subtitleSamples: SubtitleSample[] = [
  {
    format: "ass",
    label: "ASS",
    fileName: "opening.ass",
    source: `[Script Info]
Title: Launch demo
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, BackColour, Bold, Italic, Underline, Alignment, MarginL, MarginR, MarginV
Style: Default,Inter,44,&H00FFFFFF,&H96000000,0,0,0,2,0080,0080,0048
Style: Aside,Inter,34,&H0038F4FF,&H96000000,-1,0,0,8,0080,0080,0040

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.40,0:00:02.90,Aside,Narrator,0000,0000,0040,,{\\an8}All systems are live
Dialogue: 0,0:00:03.10,0:00:05.60,Default,Operator,0000,0000,0048,,Caption styling stays with the cue
Dialogue: 0,0:00:06.00,0:00:08.70,Default,Operator,0000,0000,0048,,ASS line breaks\\Nrender as stacked text
`,
  },
  {
    format: "youtube",
    label: "YouTube",
    fileName: "captions.sbv",
    source: `0:00:00.500,0:00:02.300
Welcome back to the workshop

0:00:02.600,0:00:05.100
Today we are testing YouTube SBV captions

0:00:05.300,0:00:08.000
The preview follows the active subtitle timing
`,
  },
  {
    format: "vtt",
    label: "WebVTT",
    fileName: "scene.vtt",
    source: `WEBVTT

intro
00:00:00.800 --> 00:00:02.800 align:start position:20%
Left aligned WebVTT cue

middle
00:00:03.000 --> 00:00:05.800 align:center position:50%
Centered cue with preserved settings

outro
00:00:06.100 --> 00:00:08.800 align:end position:82%
Right aligned cue
`,
  },
  {
    format: "srt",
    label: "SRT",
    fileName: "dialogue.srt",
    source: `1
00:00:00,600 --> 00:00:02,500
Hello there

2
00:00:02,900 --> 00:00:04,700
General Kenobi

3
00:00:05,000 --> 00:00:07,200
You can scrub through this file
`,
  },
];

const initialSample = subtitleSamples[0]!;

function SubtitlesPage() {
  const [source, setSource] = useState(initialSample.source);
  const [fileName, setFileName] = useState(initialSample.fileName);
  const [format, setFormat] = useState<TimedTextFormat>(initialSample.format);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const frameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | undefined>(undefined);

  const parsed = useMemo(() => parseSubtitleSource(source, fileName, format), [source, fileName, format]);
  const document = parsed.document;
  const durationMs = useMemo(
    () => Math.max(1, ...document.cues.map((cue) => cue.endTimeMs)),
    [document],
  );
  const activeCues = useMemo(
    () =>
      document.cues.filter(
        (cue) => currentTimeMs >= cue.startTimeMs && currentTimeMs <= cue.endTimeMs,
      ),
    [currentTimeMs, document],
  );
  const currentCue = activeCues[activeCues.length - 1];
  const overlaps = useMemo(() => detectCueOverlaps(document), [document]);
  const validation = useMemo(() => validateTimedTextDocument(document), [document]);
  const serialized = useMemo(() => serializeSafe(document, format), [document, format]);
  const transcript = useMemo(() => collectTimedTextText(document, { separator: " " }), [document]);

  useEffect(() => {
    setCurrentTimeMs((value) => Math.min(value, durationMs));
  }, [durationMs]);

  useEffect(() => {
    if (!isPlaying || parsed.error) {
      return undefined;
    }

    const tick = (now: number) => {
      const lastFrameTime = lastFrameTimeRef.current ?? now;
      const deltaMs = (now - lastFrameTime) * playbackRate;
      lastFrameTimeRef.current = now;

      setCurrentTimeMs((value) => {
        const nextValue = value + deltaMs;

        if (nextValue >= durationMs) {
          setIsPlaying(false);
          return durationMs;
        }

        return nextValue;
      });

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = undefined;
      lastFrameTimeRef.current = undefined;
    };
  }, [durationMs, isPlaying, parsed.error, playbackRate]);

  const loadSample = (sample: SubtitleSample) => {
    setSource(sample.source);
    setFileName(sample.fileName);
    setFormat(sample.format);
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  return (
    <PlaygroundPage
      activePage="subtitles"
      title="Subtitles package player"
      description="Play, scrub, and inspect SRT, WebVTT, ASS, and YouTube captions through the shared timed-text model."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
        <Card className="rounded-none border-border/60 bg-background/70 shadow-2xl shadow-black/10">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {subtitleSamples.map((sample) => (
                  <Button
                    key={sample.fileName}
                    type="button"
                    size="sm"
                    variant={sample.fileName === fileName ? "default" : "outline"}
                    onClick={() => loadSample(sample)}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
              <Badge variant={parsed.error ? "destructive" : "secondary"} className="px-3 py-1">
                {parsed.error ? "Parse error" : `${document.cues.length} cues`}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                File
                <input
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  className="h-10 border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Format
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value as TimedTextFormat)}
                  className="h-10 border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="ass">ASS</option>
                  <option value="youtube">YouTube SBV/XML</option>
                  <option value="vtt">WebVTT</option>
                  <option value="srt">SRT</option>
                  <option value="transcript-json">Transcript JSON</option>
                </select>
              </label>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setCurrentTimeMs(0);
                setIsPlaying(false);
              }}
              spellCheck={false}
              className="min-h-[340px] resize-y rounded-none font-mono text-xs leading-5"
            />
            {parsed.error ? (
              <div className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {parsed.error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-none border-border/60 bg-background/70 shadow-2xl shadow-black/10">
            <CardContent className="space-y-4 p-4">
              <SubtitleStage document={document} cues={activeCues} currentCue={currentCue} />

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    title={isPlaying ? "Pause" : "Play"}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    onClick={() => {
                      if (currentTimeMs >= durationMs) {
                        setCurrentTimeMs(0);
                      }
                      setIsPlaying((value) => !value);
                    }}
                    disabled={Boolean(parsed.error)}
                    className="shrink-0"
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Restart"
                    aria-label="Restart"
                    onClick={() => {
                      setCurrentTimeMs(0);
                      setIsPlaying(false);
                    }}
                  >
                    <RestartIcon />
                  </Button>
                  <Slider
                    min={0}
                    max={durationMs}
                    step={10}
                    value={[currentTimeMs]}
                    onValueChange={(value) => setCurrentTimeMs(value[0] ?? 0)}
                    disabled={Boolean(parsed.error)}
                    aria-label="Playback position"
                  />
                  <div className="w-[112px] shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {formatClock(currentTimeMs)} / {formatClock(durationMs)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        size="sm"
                        variant={rate === playbackRate ? "default" : "outline"}
                        onClick={() => setPlaybackRate(rate)}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                  <p className="max-w-[320px] truncate text-sm text-muted-foreground">
                    {currentCue?.text ?? "No active subtitle"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border/60 bg-background/70 shadow-2xl shadow-black/10">
            <CardContent className="p-4">
              <Tabs defaultValue="cues">
                <TabsList>
                  <TabsTrigger value="cues">Cues</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                </TabsList>
                <TabsContent value="cues" className="mt-4 space-y-2">
                  {document.cues.map((cue) => (
                    <Item
                      key={cue.id}
                      variant="muted"
                      className={cn(
                        "items-start bg-muted/20",
                        cue.id === currentCue?.id && "border-primary/70 bg-primary/10",
                      )}
                    >
                      <ItemContent>
                        <ItemTitle>{cue.text || cue.id}</ItemTitle>
                        <ItemDescription>
                          {formatClock(cue.startTimeMs)} - {formatClock(cue.endTimeMs)}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </TabsContent>
                <TabsContent value="output" className="mt-4 space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{transcript}</p>
                  <pre className="max-h-[260px] overflow-auto bg-muted/30 p-3 text-xs leading-5">
                    {serialized}
                  </pre>
                </TabsContent>
                <TabsContent value="diagnostics" className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Overlaps" value={String(overlaps.length)} />
                    <Stat label="Issues" value={String(validation.length)} />
                  </div>
                  {validation.map((issue) => (
                    <Item key={`${issue.code}-${issue.cueId}`} variant="muted" className="bg-muted/20">
                      <ItemContent>
                        <ItemTitle>{issue.code}</ItemTitle>
                        <ItemDescription>{issue.message}</ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

function SubtitleStage({
  document,
  cues,
  currentCue,
}: {
  document: TimedTextDocument;
  cues: TimedTextCue[];
  currentCue: TimedTextCue | undefined;
}) {
  return (
    <div className="relative aspect-video overflow-hidden border border-border bg-zinc-950 text-white shadow-inner">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b2956_0%,#152d35_34%,#262028_68%,#111113_100%)]" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-xs uppercase tracking-[0.22em] text-white/58">
        <span>{document.format}</span>
        <span>{currentCue?.id ?? "standby"}</span>
      </div>
      <div className="absolute left-[9%] top-[18%] h-[46%] w-[35%] border border-white/15 bg-white/8" />
      <div className="absolute right-[10%] top-[22%] grid h-[38%] w-[30%] grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="bg-white/10" />
        ))}
      </div>

      {cues.length > 0 ? (
        cues.map((cue) => <RenderedCue key={cue.id} cue={cue} />)
      ) : (
        <div className="absolute inset-x-[10%] bottom-[9%] mx-auto text-center text-sm text-white/58">
          {currentCue?.text ?? " "}
        </div>
      )}
    </div>
  );
}

function RenderedCue({ cue }: { cue: TimedTextCue }) {
  const placement = getCuePlacement(cue);
  const style = getCueStyle(cue);

  return (
    <div
      className={cn("absolute flex max-w-[86%]", placement.className)}
      style={placement.position}
    >
      <div
        className="whitespace-pre-line border border-white/10 px-3 py-2 text-center shadow-2xl shadow-black/45"
        style={style}
      >
        {cue.text}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/70 bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function PlayIcon() {
  return <span aria-hidden="true" className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-current" />;
}

function PauseIcon() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center gap-1">
      <span className="h-4 w-1.5 bg-current" />
      <span className="h-4 w-1.5 bg-current" />
    </span>
  );
}

function RestartIcon() {
  return (
    <span aria-hidden="true" className="relative h-4 w-4 rounded-full border-2 border-current border-r-transparent">
      <span className="absolute -left-1 top-0 h-0 w-0 border-y-[4px] border-r-[7px] border-y-transparent border-r-current" />
    </span>
  );
}

function parseSubtitleSource(source: string, fileName: string, format: TimedTextFormat) {
  try {
    return {
      document: parseTimedText(source, { fileName, format }),
      error: undefined,
    };
  } catch (error) {
    return {
      document: {
        format,
        cues: [],
      } satisfies TimedTextDocument,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function serializeSafe(document: TimedTextDocument, format: TimedTextFormat) {
  try {
    return serializeTimedText(document, { format });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function formatClock(value: number) {
  const safeValue = Math.max(0, Math.round(value));
  const minutes = Math.floor(safeValue / 60_000);
  const seconds = Math.floor((safeValue % 60_000) / 1000);
  const milliseconds = Math.floor((safeValue % 1000) / 10);

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}`;
}

function getCuePlacement(cue: TimedTextCue): {
  className: string;
  position?: CSSProperties;
} {
  const alignment = cue.settings?.["ass-alignment"];
  const position = cue.settings?.["ass-position"];

  if (position) {
    const [x, y] = position.split(",").map((entry) => Number(entry));
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return {
        className: "-translate-x-1/2 -translate-y-1/2 justify-center",
        position: {
          left: `${Math.max(0, Math.min(100, (x / 1280) * 100))}%`,
          top: `${Math.max(0, Math.min(100, (y / 720) * 100))}%`,
        },
      };
    }
  }

  if (alignment === "7" || alignment === "8" || alignment === "9") {
    return { className: "inset-x-[7%] top-[8%] justify-center" };
  }

  if (alignment === "4" || alignment === "5" || alignment === "6") {
    return { className: "inset-x-[7%] top-1/2 -translate-y-1/2 justify-center" };
  }

  const vttPosition = cue.settings?.position;
  const vttAlign = cue.settings?.align;

  if (vttPosition) {
    const numericPosition = Number.parseFloat(vttPosition);
    if (Number.isFinite(numericPosition)) {
      return {
        className: cn(
          "bottom-[9%]",
          vttAlign === "start" && "justify-start",
          vttAlign === "end" && "justify-end",
          (!vttAlign || vttAlign === "center") && "-translate-x-1/2 justify-center",
        ),
        position: {
          left: `${Math.max(8, Math.min(92, numericPosition))}%`,
        },
      };
    }
  }

  return { className: "inset-x-[7%] bottom-[9%] justify-center" };
}

function getCueStyle(cue: TimedTextCue): CSSProperties {
  const color = assColorToCss(cue.settings?.["ass-primary-color"]) ?? "#ffffff";
  const backgroundColor = assColorToCss(cue.settings?.["ass-back-color"], 0.72) ?? "rgba(0,0,0,0.72)";
  const fontSize = Number(cue.settings?.["ass-font-size"]);

  return {
    backgroundColor,
    color,
    fontFamily: cue.settings?.["ass-font"] ?? "Inter, system-ui, sans-serif",
    fontSize: Number.isFinite(fontSize) ? `${Math.max(16, Math.min(34, fontSize * 0.58))}px` : "24px",
    fontStyle: cue.settings?.["ass-italic"] && cue.settings["ass-italic"] !== "0" ? "italic" : undefined,
    fontWeight: cue.settings?.["ass-bold"] && cue.settings["ass-bold"] !== "0" ? 700 : 600,
    lineHeight: 1.22,
    textAlign: getCueTextAlign(cue),
    textShadow: "0 2px 4px rgba(0,0,0,0.88)",
  };
}

function getCueTextAlign(cue: TimedTextCue): CSSProperties["textAlign"] {
  const assAlignment = cue.settings?.["ass-alignment"];

  if (assAlignment === "1" || assAlignment === "4" || assAlignment === "7") {
    return "left";
  }

  if (assAlignment === "3" || assAlignment === "6" || assAlignment === "9") {
    return "right";
  }

  if (cue.settings?.align === "start") {
    return "left";
  }

  if (cue.settings?.align === "end") {
    return "right";
  }

  return "center";
}

function assColorToCss(value: string | undefined, alphaOverride?: number): string | undefined {
  const match = value?.match(/^&H(?<alpha>[\da-f]{2})(?<blue>[\da-f]{2})(?<green>[\da-f]{2})(?<red>[\da-f]{2})$/iu);

  if (!match?.groups) {
    return undefined;
  }

  const red = Number.parseInt(match.groups.red, 16);
  const green = Number.parseInt(match.groups.green, 16);
  const blue = Number.parseInt(match.groups.blue, 16);
  const alpha = alphaOverride ?? 1 - Number.parseInt(match.groups.alpha, 16) / 255;

  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

mountPage(<SubtitlesPage />);
