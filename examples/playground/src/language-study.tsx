import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex, searchCorpus } from "@moritzbrantner/linguistics-corpus";
import {
  createInterlinearRows,
  deriveStudyTerms,
  findUnknownTerms,
  rankStudyTerms,
} from "@moritzbrantner/linguistics-learning";
import { ParallelTextView } from "@moritzbrantner/parallel-text";
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

const originalDocument = createTextDocument({
  id: "study-original",
  language: "en",
  text: "The harbor wakes before dawn. The market wakes the square.",
});
const translatedDocument = createTextDocument({
  id: "study-translation",
  language: "de",
  text: "Der Hafen erwacht vor der Daemmerung. Der Markt weckt den Platz.",
});
const interlinearRows = createInterlinearRows(
  originalDocument,
  [
    {
      normalized: "harbor",
      gloss: "port area",
      lemma: "harbor",
      partOfSpeech: "NOUN",
    },
    {
      normalized: "wakes",
      gloss: "becomes active",
      lemma: "wake",
      partOfSpeech: "VERB",
    },
  ],
);
const studyTerms = deriveStudyTerms(originalDocument);
const corpus = createCorpusIndex({
  documents: [
    originalDocument,
    createTextDocument({
      id: "study-corpus-1",
      language: "en",
      text: "The market wakes early. The market opens before dawn.",
    }),
  ],
});
const unknownTerms = findUnknownTerms(originalDocument, ["the", "before"]);
const rankedTerms = rankStudyTerms(unknownTerms, corpus);
const harborHits = searchCorpus("market wakes", {
  index: corpus,
});

function LanguageStudyPage() {
  return (
    <PlaygroundPage
      activePage="language-study"
      title="Core to study workflow"
      description="A combined example showing linguistics-core documents feeding parallel text rendering, interlinear annotation rows, study-term extraction, and corpus-aware ranking without redefining sentence or token boundaries in each package."
    >
      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Study stack
            </Badge>
            <CardTitle>Foundation-first behavior</CardTitle>
            <CardDescription>
              The same source document drives alignment, annotation, unknown-term
              detection, and corpus lookups. The interesting part is not the UI; it is that the
              offsets and normalized forms are shared across packages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              The parallel reader below receives `TextDocument` inputs directly, so it reuses the same sentence segmentation already used by the learning helpers.
            </p>
            <p>
              The interlinear rows expose token-level annotations for {interlinearRows.filter((row) => row.gloss).length} annotated forms.
            </p>
            <p>
              Unknown-term ranking changes once the corpus knows that <code>market</code> and <code>wakes</code> are common in surrounding material.
            </p>
            <p>
              Phrase search for <code>market wakes</code> finds {harborHits.length} aligned study examples in the shared corpus index.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Parallel text from documents</CardTitle>
            <CardDescription>
              `parallel-text` is reading the same document model that the corpus and learning packages are reading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParallelTextView
              originalDocument={originalDocument}
              translatedDocument={translatedDocument}
              originalLabel="Source document"
              translatedLabel="Translation document"
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Interlinear rows</CardTitle>
            <CardDescription>
              Learning annotations stay attached to the canonical normalized token forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {interlinearRows
              .filter((row) => row.gloss)
              .map((row) => (
                <div key={row.tokenId} className="rounded-[1.1rem] border border-border/60 bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{row.surface}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {row.partOfSpeech}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Lemma: {row.lemma} | Gloss: {row.gloss}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Ranked study terms</CardTitle>
            <CardDescription>
              The first list is raw derivation from the document. The second list applies corpus-aware ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Derived terms</p>
              {studyTerms.map((term) => (
                <div key={term.term} className="rounded-[1.1rem] border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="font-medium text-foreground">{term.term}</p>
                  <p className="text-sm text-muted-foreground">Count {term.count}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Unknown and ranked</p>
              {rankedTerms.map((term) => (
                <div key={term.term} className="rounded-[1.1rem] border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="font-medium text-foreground">{term.term}</p>
                  <p className="text-sm text-muted-foreground">
                    Surface {term.surfaceForms[0]} | Documents {term.documentIds.length}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LanguageStudyPage />);
