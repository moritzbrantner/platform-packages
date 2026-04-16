import {
  createTextDocument,
  findTokenAtOffset,
  sliceDocumentText,
} from "@moritzbrantner/linguistics-core";
import { createCorpusIndex, searchCorpus } from "@moritzbrantner/linguistics-corpus";
import { transcriptToPhrases } from "@moritzbrantner/speech";
import {
  fromSpeechTranscriptionResult,
  serializeTimedText,
  toTextDocument,
} from "@moritzbrantner/subtitles";
import { WordPredictionComposer, createWordPredictionModel } from "@moritzbrantner/word-prediction";
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

const speechResult = {
  text: "Hello team, the meeting starts now. Hello team, please send the summary tonight.",
  language: "en",
  isFinal: true,
  durationMs: 5200,
  segments: [
    {
      id: "speech-1",
      startTimeMs: 0,
      endTimeMs: 2200,
      text: "Hello team, the meeting starts now.",
      final: true,
      source: "live-stream" as const,
    },
    {
      id: "speech-2",
      startTimeMs: 2200,
      endTimeMs: 5200,
      text: "Hello team, please send the summary tonight.",
      final: true,
      source: "live-stream" as const,
    },
  ],
};

const subtitleDocument = fromSpeechTranscriptionResult(speechResult);
const textDocument = toTextDocument(subtitleDocument, {
  id: "speech-flow",
  separator: " ",
});
const corpus = createCorpusIndex({
  documents: [textDocument],
});
const predictions = createWordPredictionModel({
  includeDefaultData: true,
  documents: [textDocument, createTextDocument({ text: transcriptToPhrases(speechResult.text).join(". ") })],
});
const token = findTokenAtOffset(
  textDocument,
  textDocument.text.indexOf("meeting") + 2,
);
const meetingHits = searchCorpus("hello team", {
  index: corpus,
});

function LanguagePipelinePage() {
  return (
    <PlaygroundPage
      activePage="language-pipeline"
      title="Speech to text-document pipeline"
      description="A combined example showing how speech-style transcript output becomes subtitles, then a linguistics-core document, then searchable corpus data and next-word predictions without each package re-parsing text separately."
    >
      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Pipeline
            </Badge>
            <CardTitle>What this page is proving</CardTitle>
            <CardDescription>
              The transcript starts as speech-style timed segments, becomes subtitle cues,
              then a canonical text document, then feeds search and prediction without
              another tokenization layer inside those downstream packages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              The speech result contains 2 timed segments and produces {subtitleDocument.cues.length} subtitle cues.
            </p>
            <p>
              The core document has {textDocument.sentences.length} sentences and {textDocument.tokens.filter((next) => next.isWord).length} word tokens.
            </p>
            <p>
              Token lookup at the middle of <code>meeting</code> resolves to <code>{token?.text}</code>, and slicing that range returns <code>{sliceDocumentText(textDocument, token?.range ?? { start: 0, end: 0 })}</code>.
            </p>
            <p>
              Phrase search for <code>hello team</code> finds {meetingHits.length} repeated training matches in the converted document.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Timed text output</CardTitle>
              <CardDescription>
                `subtitles` keeps the transcript in a timed form first, so it can still
                round-trip to SRT or VTT before anyone asks for a plain text document.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-[1.35rem] border border-border/60 bg-muted/40 p-4 text-xs leading-6">
                {serializeTimedText(subtitleDocument, { format: "srt" })}
              </pre>
            </CardContent>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle>Core document snapshot</CardTitle>
                <CardDescription>
                  The document is now ready for indexing, unknown-term detection, or any other language-layer work.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                {textDocument.sentences.map((sentence) => (
                  <div key={sentence.id} className="rounded-[1.1rem] border border-border/60 bg-muted/30 px-4 py-3">
                    <p className="font-medium text-foreground">{sentence.text}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em]">
                      {sentence.tokens.filter((next) => next.isWord).map((next) => next.normalized).join(" | ")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle>Prediction trained from documents</CardTitle>
                <CardDescription>
                  The composer is trained from the converted `TextDocument`, not from a separate ad hoc tokenizer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WordPredictionComposer model={predictions} defaultValue="Hello team " />
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LanguagePipelinePage />);
