import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import {
  createFlashcardSet,
  createInterlinearBlock,
  deriveCorpusStudyTerms,
  gradeRecall,
} from "@moritzbrantner/linguistics-learning";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const learningCorpus = createCorpusIndex([
  createTextDocument({
    id: "learning-demo-1",
    language: "en",
    text: "Students study nightly. A student studied last night while studying grammar.",
  }),
  createTextDocument({
    id: "learning-demo-2",
    language: "en",
    text: "Grammar students study together. Studying vocabulary helps every student.",
  }),
]);
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
const terms = deriveCorpusStudyTerms(learningCorpus, {
  minFrequency: 1,
  includeNamedEntities: true,
  includeMultiwordTerms: true,
});
const flashcards = createFlashcardSet(
  terms.filter((term) => term.count >= 3),
  { sourceLanguage: "en", targetLanguage: "de" },
);
const review = gradeRecall({ quality: 4, reviewedAt: "2026-04-16T00:00:00.000Z" }, []);

function LinguisticsLearningPage() {
  return (
    <PlaygroundPage
      activePage="linguistics-learning"
      title="Linguistics learning package examples"
      description="Inspect interlinear token alignment, corpus-derived study terms, flashcard generation, and the SM-2 style grading state used for follow-up reviews."
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
              <Item key={token.sourceTokenIndex} variant="muted" className="bg-muted/20">
                <ItemContent>
                  <ItemTitle>{token.text}</ItemTitle>
                  <ItemDescription>{token.gloss}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Derived study terms</CardTitle>
              <CardDescription>
                Inflection-heavy forms collapse into a shared lemma and stay aggregated across the corpus before flashcards are generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
              {terms.slice(0, 8).map((term) => (
                <Item key={term.id} variant="muted" className="items-start bg-muted/20">
                  <ItemContent>
                    <ItemTitle>{term.lemma}</ItemTitle>
                    <ItemDescription>
                      {term.kind} • {term.count} hits • {term.documentCount} docs
                    </ItemDescription>
                    <p>{term.surfaces.join(", ")}</p>
                  </ItemContent>
                </Item>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Flashcards and review state</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {flashcards.cards.map((card) => (
                <Item key={card.id} variant="muted" className="bg-muted/20">
                  <ItemContent>
                    <ItemTitle>{card.front}</ItemTitle>
                    <ItemDescription>{card.back}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
              <Item variant="muted" className="items-start bg-muted/20">
                <ItemContent>
                  <ItemTitle>Next review</ItemTitle>
                  <ItemDescription>{review.intervalDays} day interval</ItemDescription>
                  <p>{review.dueAt}</p>
                </ItemContent>
              </Item>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LinguisticsLearningPage />);
