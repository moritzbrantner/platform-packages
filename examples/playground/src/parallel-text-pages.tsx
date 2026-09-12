import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  ParallelTextView,
  type ParallelTextLayout,
  type ParallelTextTranslationOption,
} from "@moritzbrantner/parallel-text";

import "./parallel-text-pages.css";

const sourceText = [
  "The old harbor wakes before dawn.",
  "Fishermen untangle their nets beside the market.",
  "By sunrise, the square is already loud.",
].join(" ");

const translations: ParallelTextTranslationOption[] = [
  {
    id: "de",
    label: "German · reordered",
    translatedLabel: "German translation",
    translatedText: [
      "Fischer entwirren ihre Netze neben dem Markt.",
      "Der alte Hafen erwacht vor Tagesanbruch.",
      "Bei Sonnenaufgang ist der Platz bereits laut.",
    ].join(" "),
    language: "German",
    languageCode: "de",
    sentenceAlignments: [
      { original: 0, translated: 1, source: "manual", confidence: 1 },
      { original: 1, translated: 0, source: "manual", confidence: 1 },
      { original: 2, translated: 2, source: "model", confidence: 0.98 },
    ],
    tokenAlignments: [
      {
        originalSentence: 0,
        translatedSentence: 1,
        originalToken: 2,
        translatedToken: 2,
        source: "model",
        confidence: 0.99,
      },
      {
        originalSentence: 1,
        translatedSentence: 0,
        originalToken: 0,
        translatedToken: 0,
        source: "model",
        confidence: 0.99,
      },
      {
        originalSentence: 1,
        translatedSentence: 0,
        originalToken: 3,
        translatedToken: 3,
        source: "model",
        confidence: 0.98,
      },
      {
        originalSentence: 2,
        translatedSentence: 2,
        originalToken: 1,
        translatedToken: 1,
        source: "model",
        confidence: 0.98,
      },
      {
        originalSentence: 2,
        translatedSentence: 2,
        originalToken: 3,
        translatedToken: 4,
        source: "model",
        confidence: 0.97,
      },
    ],
  },
  {
    id: "fr",
    label: "French",
    translatedLabel: "French translation",
    translatedText: [
      "Le vieux port se réveille avant l'aube.",
      "Les pêcheurs démêlent leurs filets près du marché.",
      "Au lever du soleil, la place est déjà bruyante.",
    ].join(" "),
    language: "French",
    languageCode: "fr",
    sentenceAlignments: [
      { original: 0, translated: 0, source: "model", confidence: 0.98 },
      { original: 1, translated: 1, source: "model", confidence: 0.97 },
      { original: 2, translated: 2, source: "model", confidence: 0.96 },
    ],
  },
];

function ParallelTextPagesDemo() {
  const [layout, setLayout] = useState<ParallelTextLayout>("aligned");

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-4 py-8 md:px-8 md:py-12">
      <header className="grid max-w-4xl gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            @moritzbrantner/parallel-text
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            GitHub Pages demo
          </span>
        </div>
        <div className="grid gap-3">
          <h1 className="m-0 text-3xl font-semibold tracking-tight md:text-5xl">
            Parallel translations that stay aligned
          </h1>
          <p className="m-0 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            Compare translations without pretending that every similarly positioned word is an exact
            match. Sentence rows preserve reordering, while explicit token links carry their own
            provenance.
          </p>
        </div>
      </header>

      <section className="grid gap-4" aria-labelledby="primary-example-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h2 id="primary-example-heading" className="m-0 text-xl font-semibold">
              Reordered bilingual passage
            </h2>
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              Switch to French inside the component, or compare aligned and continuous reading modes.
            </p>
          </div>
          <div className="flex rounded-lg border border-border bg-muted/40 p-1" role="group" aria-label="Reading layout">
            {(["aligned", "flow"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={layout === option}
                onClick={() => setLayout(option)}
                className="min-h-10 rounded-md px-3 text-sm font-medium capitalize transition-colors aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <ParallelTextView
          originalText={sourceText}
          originalLabel="English source"
          originalLanguage="English"
          originalLanguageCode="en"
          translatedLabel="Translation"
          translations={translations}
          defaultTranslationId="de"
          layout={layout}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-3 md:p-6">
        <div className="grid content-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sentence alignment
          </span>
          <p className="m-0 text-sm leading-6">
            The German sentences are intentionally reordered. In aligned mode, corresponding passages
            still share one visual row.
          </p>
        </div>
        <div className="grid content-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Keyboard inspection
          </span>
          <p className="m-0 text-sm leading-6">
            Tab to a sentence. Use Left/Right Arrow, Home, and End to inspect words; press Escape to
            clear token inspection.
          </p>
        </div>
        <div className="grid content-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Provenance
          </span>
          <p className="m-0 text-sm leading-6">
            Manual and model links can highlight exact counterparts. Heuristic sentence context does
            not fabricate a word translation.
          </p>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="rtl-example-heading">
        <div className="grid gap-1">
          <h2 id="rtl-example-heading" className="m-0 text-xl font-semibold">
            Language and direction metadata
          </h2>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            Each side owns its language and text direction independently.
          </p>
        </div>
        <ParallelTextView
          originalText="Careful reading makes difficult ideas easier to compare."
          translatedText="تجعل القراءة المتأنية الأفكار الصعبة أسهل للمقارنة."
          originalLabel="English"
          originalLanguage="English"
          originalLanguageCode="en"
          translatedLabel="Arabic"
          translationLanguage="Arabic"
          translationLanguageCode="ar"
          translationDirection="rtl"
        />
      </section>

      <footer className="border-t border-border pt-5 text-sm text-muted-foreground">
        Built from the package source in this repository. The production component remains independent
        from this demo page.
      </footer>
    </main>
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Could not find #root.");
}

createRoot(root).render(
  <StrictMode>
    <ParallelTextPagesDemo />
  </StrictMode>,
);
