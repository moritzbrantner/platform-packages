import { createTextDocument } from "@moritzbrantner/linguistics-core";
import {
  createFlashcardSet,
  createInterlinearBlock,
  deriveStudyTerms,
  gradeRecall,
} from "@moritzbrantner/linguistics-learning";
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

const document = createTextDocument({
  id: "learning-demo",
  language: "en",
  text: "Students study nightly. A student studied last night while studying grammar.",
});
const interlinear = createInterlinearBlock(
  createTextDocument({
    id: "interlinear-demo",
    language: "es",
    text: "Buenos dias amigo.",
  }),
  [
    { sourceTokenIndex: 0, gloss: "good" },
    { sourceTokenIndex: 1, gloss: "day" },
    { sourceTokenIndex: 2, gloss: "friend" },
  ],
);
const terms = deriveStudyTerms(document, {
  minFrequency: 1,
  includeNamedEntities: true,
  includeMultiwordTerms: true,
});
const flashcards = createFlashcardSet(
  terms.filter((term) => term.count >= 2),
  { sourceLanguage: "en", targetLanguage: "de" },
);
const review = gradeRecall({ quality: 4, reviewedAt: "2026-04-16T00:00:00.000Z" }, []);

function LinguisticsLearningPage() {
  return (
    <PlaygroundPage
      activePage="linguistics-learning"
      title="Linguistics learning package examples"
      description="Inspect interlinear token alignment, derived study terms, flashcard generation, and the SM-2 style grading state used for follow-up reviews."
    >
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Interlinear block
            </Badge>
            <CardTitle>Glossed tokens</CardTitle>
            <CardDescription>
              The alignment rows preserve the source token index and span, so later tools can anchor back into the original document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {interlinear.tokens.map((token) => (
              <div key={token.sourceTokenIndex} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                <p className="font-medium">{token.text}</p>
                <p className="text-muted-foreground">{token.gloss}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Derived study terms</CardTitle>
              <CardDescription>
                Inflection-heavy forms collapse into a shared lemma before flashcards are generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
              {terms.slice(0, 8).map((term) => (
                <div key={term.id} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                  <p className="font-medium">{term.lemma}</p>
                  <p className="text-muted-foreground">{term.kind} • {term.count}</p>
                  <p>{term.surfaces.join(", ")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Flashcards and review state</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {flashcards.cards.map((card) => (
                <div key={card.id} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                  <p className="font-medium">{card.front}</p>
                  <p className="text-muted-foreground">{card.back}</p>
                </div>
              ))}
              <div className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-3">
                <p className="font-medium">Next review</p>
                <p className="text-muted-foreground">{review.intervalDays} day interval</p>
                <p>{review.dueAt}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LinguisticsLearningPage />);
