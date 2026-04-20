import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
import {
  createWordVectorBackoffSource,
  createWordVectorModel,
  deserializeWordVectorModel,
  serializeWordVectorModel,
  trainFromCorpus,
} from "@moritzbrantner/word-vectors";
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

const texts = [
  "Coffee beans smell rich.",
  "Tea leaves smell fresh.",
  "Coffee cups stay warm.",
];
const model = createWordVectorModel({
  texts,
  windowSize: 2,
});
const restored = deserializeWordVectorModel(serializeWordVectorModel(model));
const similarWords = restored.findSimilarWords("coffee", { limit: 4 });
const similarContexts = restored.findSimilarContexts("coffee", { limit: 4 });
const corpus = createCorpusIndex(
  texts.map((text, index) =>
    createTextDocument({
      id: `doc-${index}`,
      text,
    }),
  ),
);
const fromCorpus = trainFromCorpus(corpus, {
  windowSize: 2,
});
const semanticBackoff = createWordVectorBackoffSource(fromCorpus)(["coffee"]);

function WordVectorsPage() {
  return (
    <PlaygroundPage
      activePage="word-vectors"
      title="Word vectors package examples"
      description="Inspect distributional similarity, sparse context weights, JSON persistence, and the corpus adapter that feeds optional semantic backoff into prediction."
    >
      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Persistence
            </Badge>
            <CardTitle>Roundtrip state</CardTitle>
            <CardDescription>
              Similarity should stay deterministic after serializing and reloading the model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Similarity:</strong> {restored.similarity("coffee", "tea").toFixed(3)}</p>
            <p><strong>Vocabulary:</strong> {restored.words().join(", ")}</p>
            <p><strong>Corpus adapter similarity:</strong> {fromCorpus.similarity("coffee", "tea").toFixed(3)}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Similar words</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
              {similarWords.map((entry) => (
                <Item key={entry.word} variant="muted" className="bg-muted/20">
                  <ItemContent>
                    <ItemTitle>{entry.word}</ItemTitle>
                    <ItemDescription>score {entry.score.toFixed(3)}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Contexts and backoff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Context weights:</strong> {similarContexts.map((entry) => `${entry.word} (${entry.weight.toFixed(2)})`).join(", ")}</p>
              <p><strong>Semantic backoff:</strong> {Array.from(semanticBackoff).map((entry) => `${entry.word}:${entry.score?.toFixed(2) ?? "1.00"}`).join(", ")}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<WordVectorsPage />);
