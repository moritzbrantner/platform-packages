import {
  anchorSpan,
  createTextDocument,
  normalizeText,
  reanchorSpan,
  segmentTextDocument,
} from "@moritzbrantner/linguistics-core";
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

const sourceText = "Cafe\u0301 lights glow.\n\nHello 世界. مرحبا بالعالم.";
const segmented = segmentTextDocument(
  createTextDocument({
    id: "core-demo",
    language: "und",
    text: sourceText,
  }),
  { granularity: "word", useIntlSegmenter: false },
);
const anchoredWord = "lights";
const anchorStart = sourceText.indexOf(anchoredWord);
const anchor = anchorSpan(segmented, {
  start: anchorStart,
  end: anchorStart + anchoredWord.length,
});
const reanchored = reanchorSpan(
  createTextDocument({
    id: "core-demo-edited",
    text: `Draft intro.\n${sourceText}`,
  }),
  anchor,
);

function LinguisticsCorePage() {
  return (
    <PlaygroundPage
      activePage="linguistics-core"
      title="Linguistics core package examples"
      description="Inspect the shared text-document model: Unicode normalization, paragraph and sentence segmentation, mixed-script tokenization, and stable text anchoring after edits."
    >
      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Core behaviors
            </Badge>
            <CardTitle>What this page validates</CardTitle>
            <CardDescription>
              The examples mirror the package tests so manual inspection stays aligned with the public API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Paragraphs, sentences, and tokens all come from the same document object.</p>
            <p>Normalization preserves browser-safe Unicode handling without pulling in an NLP dependency.</p>
            <p>Span anchors store enough local context to recover offsets after earlier edits shift the text.</p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Normalization and segmentation</CardTitle>
              <CardDescription>
                The source text mixes decomposed Unicode, Latin, CJK, and Arabic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p><strong>Original:</strong> {sourceText}</p>
              <p><strong>NFKC + stripped diacritics:</strong> {normalizeText(sourceText, { form: "NFKC", lowercase: true, stripDiacritics: true })}</p>
              <p><strong>Paragraphs:</strong> {segmented.paragraphs.length}</p>
              <p><strong>Sentences:</strong> {segmented.sentences.map((sentence) => sentence.text).join(" | ")}</p>
              <p><strong>Word tokens:</strong> {segmented.tokens.filter((token) => token.isWordLike).map((token) => token.text).join(" · ")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Span anchoring</CardTitle>
              <CardDescription>
                This anchor was created before a new intro line was inserted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Anchor text:</strong> {anchor.text}</p>
              <p><strong>Original range:</strong> {anchor.start}-{anchor.end}</p>
              <p><strong>Reanchored range:</strong> {reanchored?.start}-{reanchored?.end}</p>
              <p><strong>Reanchored text:</strong> {reanchored?.text}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LinguisticsCorePage />);
