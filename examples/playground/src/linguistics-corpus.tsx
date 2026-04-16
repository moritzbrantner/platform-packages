import { createTextDocument } from "@moritzbrantner/linguistics-core";
import { createCorpusIndex } from "@moritzbrantner/linguistics-corpus";
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
              <div key={result.documentId} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="font-medium">{result.documentId}</p>
                <p className="text-muted-foreground">score {result.score} • matches {result.matches}</p>
                <p className="mt-2">{result.snippet}</p>
              </div>
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
              <div key={`${entry.language}-${entry.term}`} className="rounded-[1.25rem] border border-border/60 bg-muted/20 p-4">
                <p className="font-medium">{entry.term}</p>
                <p className="text-muted-foreground">{entry.language} • {entry.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<LinguisticsCorpusPage />);
