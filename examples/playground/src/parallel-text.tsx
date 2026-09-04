import { MultilingualText, ParallelTextView } from "@moritzbrantner/parallel-text";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const sourceExcerpt = [
  "The old harbor wakes before dawn. Fishermen untangle their nets while the market lights flicker on.",
  "By sunrise, the square is already loud with bargaining, laughter, and the smell of coffee.",
].join(" ");

const germanTranslation = [
  "Der alte Hafen erwacht vor der Daemmerung. Fischer entwirren ihre Netze, waehrend die Lichter des Marktes angehen.",
  "Bei Sonnenaufgang ist der Platz schon laut vor Verhandlungen, Lachen und dem Geruch von Kaffee.",
].join(" ");

const frenchTranslation = [
  "Le vieux port se reveille avant l'aube. Les pecheurs demelent leurs filets pendant que les lumieres du marche s'allument.",
  "Au lever du soleil, la place bruisse deja de marchandages, de rires et d'odeurs de cafe.",
].join(" ");

const reorderedSource = [
  "I fold the letter carefully. Then I place it under the blue cup by the window.",
  "When the train arrives, Marta is already smiling.",
].join(" ");

const reorderedTranslation = [
  "Als der Zug ankommt, laechelt Marta bereits.",
  "Dann lege ich den Brief sorgfaeltig unter die blaue Tasse am Fenster.",
].join(" ");

const aquinasSegments = [
  {
    id: "response-opening",
    cells: {
      latin: (
        <p>
          Respondeo dicendum quod Deum esse quinque viis probari potest.
        </p>
      ),
      english: (
        <p>I answer that the existence of God can be proved in five ways.</p>
      ),
      german: (
        <p>Ich antworte: Dass Gott ist, kann auf fünf Wegen bewiesen werden.</p>
      ),
    },
  },
  {
    id: "first-way",
    cells: {
      latin: (
        <p>
          Prima autem et manifestior via est, quae sumitur ex parte motus.
          Certum est enim, et sensu constat, aliqua moveri in hoc mundo.
        </p>
      ),
      english: (
        <p>
          The first and more evident way is taken from motion. For it is certain,
          and evident to the senses, that some things are moved in this world.
        </p>
      ),
      german: (
        <p>
          Der erste und deutlichste Weg wird von der Bewegung her genommen. Denn
          es ist gewiss und den Sinnen offenbar, dass sich in dieser Welt manches
          bewegt.
        </p>
      ),
    },
  },
] as const;

function ParallelTextPage() {
  return (
    <PlaygroundPage
      activePage="parallel-text"
      title="Parallel text package examples"
      description="A browser-ready demo for aligned bilingual reading, reusable multilingual columns, translation switching, provenance-aware token links, and sentence-level keyboard inspection."
    >
      <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Thomistisch dogfood
            </Badge>
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              3 columns
            </Badge>
          </div>
          <CardTitle>Latin, English, and German on one stable passage grid</CardTitle>
          <CardDescription>
            This is the generic presentation primitive needed by the Thomistisch
            canonical reader. It knows only columns, aligned segment IDs, language
            metadata, and cells; Aquinas identity and provenance remain outside the
            package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <a className="underline underline-offset-4" href="#response-opening">
              Jump to response opening
            </a>
            <span aria-hidden="true">·</span>
            <a className="underline underline-offset-4" href="#first-way">
              Jump to first way
            </a>
          </div>
          <MultilingualText
            aria-label="Aquinas Latin English German comparison"
            columns={[
              { id: "latin", label: "Latin", lang: "la", dir: "ltr" },
              { id: "english", label: "English", lang: "en", dir: "ltr" },
              { id: "german", label: "Deutsch", lang: "de", dir: "ltr" },
            ]}
            segments={aquinasSegments}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Validation checklist
            </Badge>
            <CardTitle>What to inspect on this page</CardTitle>
            <CardDescription>
              The first example above checks N-column reading. The examples beside
              this checklist exercise translation selection and explicit alignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Resize the browser and confirm the Latin, English, and German columns
              collapse cleanly instead of forcing horizontal overflow.
            </p>
            <p>
              Follow the Aquinas segment links and confirm stable IDs target the
              aligned row rather than a generated DOM position.
            </p>
            <p>
              Hover a word with an explicit model link and confirm its counterpart
              highlights on the other side. Unlinked words should keep sentence
              context without inventing an exact word translation.
            </p>
            <p>
              Tab to a sentence, then use Left/Right Arrow, Home, and End to inspect
              tokens without creating a tab stop for every word.
            </p>
            <Button asChild variant="outline">
              <a href="/storytelling.html">Compare with storytelling demo</a>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Multiple translations</CardTitle>
              <CardDescription>
                Sentence alignment stays visible while token highlights only claim
                links with explicit provenance or safe literal matches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParallelTextView
                originalText={sourceExcerpt}
                originalLabel="English excerpt"
                originalLanguage="English"
                originalLanguageCode="en"
                translatedLabel="Translation"
                translations={[
                  {
                    id: "de",
                    label: "German",
                    translatedLabel: "German translation",
                    translatedText: germanTranslation,
                    language: "German",
                    languageCode: "de",
                    tokenAlignments: [
                      {
                        originalSentence: 0,
                        translatedSentence: 0,
                        originalToken: 2,
                        translatedToken: 2,
                        source: "model",
                        confidence: 0.98,
                      },
                      {
                        originalSentence: 2,
                        translatedSentence: 2,
                        originalToken: 14,
                        translatedToken: 14,
                        source: "model",
                        confidence: 0.99,
                      },
                    ],
                  },
                  {
                    id: "fr",
                    label: "French",
                    translatedLabel: "French translation",
                    translatedText: frenchTranslation,
                    language: "French",
                    languageCode: "fr",
                    tokenAlignments: [
                      {
                        originalSentence: 0,
                        translatedSentence: 0,
                        originalToken: 2,
                        translatedToken: 2,
                        source: "model",
                        confidence: 0.97,
                      },
                      {
                        originalSentence: 2,
                        translatedSentence: 2,
                        originalToken: 14,
                        translatedToken: 15,
                        source: "model",
                        confidence: 0.96,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle>Manual sentence alignment</CardTitle>
              <CardDescription>
                This example reverses the sentence order in translation, so each
                explicit alignment renders as one source/translation row instead of
                drifting in independent columns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParallelTextView
                originalText={reorderedSource}
                translatedText={reorderedTranslation}
                originalLabel="Original sequence"
                originalLanguage="English"
                originalLanguageCode="en"
                translatedLabel="Reordered translation"
                translationLanguage="German"
                translationLanguageCode="de"
                sentenceAlignments={[
                  { original: 2, translated: 0 },
                  { original: [0, 1], translated: 1 },
                ]}
                tokenAlignments={[
                  {
                    originalSentence: 2,
                    translatedSentence: 0,
                    originalToken: 4,
                    translatedToken: 5,
                  },
                  {
                    originalSentence: 1,
                    translatedSentence: 1,
                    originalToken: 6,
                    translatedToken: 8,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<ParallelTextPage />);
