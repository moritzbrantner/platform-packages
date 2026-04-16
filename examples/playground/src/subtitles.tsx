import {
  detectCueOverlaps,
  parseVtt,
  serializeTimedText,
  validateTimedTextDocument,
} from "@moritzbrantner/subtitles";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const document = parseVtt(`WEBVTT

intro
00:00:01.000 --> 00:00:02.500 align:start position:50%
Hello there

reply
00:00:02.300 --> 00:00:04.000
General Kenobi
`);

document.cues[0]!.words = [
  { text: "Hello", startTimeMs: 1000, endTimeMs: 1500 },
  { text: "there", startTimeMs: 1500, endTimeMs: 2500 },
];

const overlaps = detectCueOverlaps(document);
const validation = validateTimedTextDocument(document);
const serialized = serializeTimedText(document, { format: "vtt" });

function SubtitlesPage() {
  return (
    <PlaygroundPage
      activePage="subtitles"
      title="Subtitles package examples"
      description="Inspect WebVTT cue settings, overlap detection, and cue validation while keeping word-level timing and serialization roundtrips intact."
    >
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Timed-text diagnostics
            </Badge>
            <CardTitle>Validation summary</CardTitle>
            <CardDescription>
              Overlap detection is diagnostic-only, so this document stays unchanged after validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Overlap count:</strong> {overlaps.length}</p>
            <p><strong>Issue count:</strong> {validation.length}</p>
            {validation.map((issue) => (
              <div key={`${issue.code}-${issue.cueId}`} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                <p className="font-medium">{issue.code}</p>
                <p className="text-muted-foreground">{issue.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Parsed cues</CardTitle>
              <CardDescription>
                The first cue keeps its WebVTT settings and word timings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {document.cues.map((cue) => (
                <div key={cue.id} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                  <p className="font-medium">{cue.id}</p>
                  <p className="text-muted-foreground">{cue.startTimeMs}ms → {cue.endTimeMs}ms</p>
                  <p>{cue.text}</p>
                  {cue.settings ? <p>settings: {Object.entries(cue.settings).map(([key, value]) => `${key}:${value}`).join(" ")}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Serialized VTT</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-[1.25rem] bg-muted/30 p-4 text-xs leading-6">{serialized}</pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<SubtitlesPage />);
