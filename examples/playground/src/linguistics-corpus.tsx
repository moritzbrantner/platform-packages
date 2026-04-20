import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
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

const corpus = createCorpusIndex([
  createTextDocument({
    id: "en-harbor",
    language: "en",
    metadata: { genre: "travel" },
    text: "The harbor market wakes early. Coffee traders greet the harbor workers.",
  }),
  createTextDocument({
    id: "de-hafen",
    language: "de",
    metadata: { genre: "travel" },
    text: "Der Hafenmarkt wacht frueh auf. Kaffeehaendler gruessen die Arbeiter.",
  }),
  createTextDocument({
    id: "en-poem",
    language: "en",
    metadata: { genre: "poetry" },
    text: "Harbor bells echo softly at night.",
  }),
]);

const searchResults = corpus.searchCorpus("harbor market", {
  metadataFilters: { genre: "travel" },
});
const concordance = corpus.concordance("harbor", { windowTokens: 2 });
const frequencies = corpus.termFrequencies({ byLanguage: true, minCount: 2 });

function LinguisticsCorpusPage() {
  return (
    <PlaygroundPage
      activePage="linguistics-corpus"
      title="Linguistics corpus package examples"
      description="Search a small in-memory corpus, inspect concordance windows, and compare multilingual term frequency output over shared text documents."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5 lg:col-span-3">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Corpus query
            </Badge>
            <CardTitle>Metadata-aware search</CardTitle>
            <CardDescription>
              Search stays deterministic and filters by the document metadata you pass into the core document model.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {searchResults.map((result) => (
              <Item key={result.documentId} variant="muted" className="items-start bg-muted/20">
                <ItemContent>
                  <ItemTitle>{result.documentId}</ItemTitle>
                  <ItemDescription>
                    score {result.score} • matches {result.matches}
                  </ItemDescription>
                  <p className="mt-1 text-sm">{result.snippet}</p>
                </ItemContent>
              </Item>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Concordance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {concordance.map((entry) => (
              <p key={`${entry.documentId}-${entry.sentenceId}-${entry.leftContext}`}>
                {entry.leftContext} <strong>{entry.keyword}</strong> {entry.rightContext}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Multilingual frequencies</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
            {frequencies.map((entry) => (
              <Item
                key={`${entry.language}-${entry.term}`}
                variant="muted"
                className="bg-muted/20"
              >
                <ItemContent>
                  <ItemTitle>{entry.term}</ItemTitle>
                  <ItemDescription>
                    {entry.language} • {entry.count}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LinguisticsCorpusPage />);
