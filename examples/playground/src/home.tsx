import { Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";

import { ExampleLinkCard, PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

function HomePage() {
  return (
    <PlaygroundPage
      activePage="home"
      title="See the packages as working pages"
      description="This playground is a lightweight workspace app for validating package styling, interactive behavior, and composition across the exported surfaces."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <ExampleLinkCard
          eyebrow="@moritzbrantner/card-games"
          title="Card game visuals demo"
          description="Inspect hover tilt, foil/glass finishes, fanned player hands, stacked decks, and themed table surfaces with responsive layout."
          href="/card-games.html"
          cta="Open card games demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/flat-design"
          title="Flat-design scene demo"
          description="Build layered SVG illustrations, swap palettes, and inspect looping flat-motion presets rendered from the new scene schema."
          href="/flat-design.html"
          cta="Open flat-design demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/linguistics-core"
          title="Linguistics core demo"
          description="Inspect Unicode normalization, multilingual segmentation, and span re-anchoring with the shared text-document model."
          href="/linguistics-core.html"
          cta="Open linguistics core demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/linguistics-corpus"
          title="Corpus indexing demo"
          description="Run metadata-aware search, inspect concordance windows, and compare multilingual frequency tables over in-memory documents."
          href="/linguistics-corpus.html"
          cta="Open corpus demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/linguistics-learning"
          title="Learning helpers demo"
          description="Derive study terms, generate flashcards, and inspect the spaced-repetition grading state produced from live text."
          href="/linguistics-learning.html"
          cta="Open learning demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/maps"
          title="Large-scale maps demo"
          description="Pan and zoom through 100,000 synthetic delivery points, watch client-side cluster totals update live, and inspect how single points reappear at close zoom."
          href="/maps.html"
          cta="Open maps demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/maps"
          title="Temporal motion stress demo"
          description="Render 10,000 dots on a separate page, keep 5,000 fixed in place, and drive 5,000 along seeded random routes with a time axis."
          href="/maps-motion.html"
          cta="Open motion demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/parallel-text"
          title="Parallel text comparison demo"
          description="Compare original and translated text side by side, hover tokens to inspect link mapping, and validate manual sentence alignment overrides."
          href="/parallel-text.html"
          cta="Open parallel text demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/speed-reading"
          title="Speed reading OCR demo"
          description="Paste any passage or upload a PDF, run cleanup on headers and page numbers, and drive an RSVP-style reader with live WPM controls."
          href="/speed-reading.html"
          cta="Open speed reading demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/speech"
          title="Speech transcription demo"
          description="Record from the microphone, upload chunks to a Whisper-style backend, and watch the returned transcript feed the predictive text model."
          href="/speech.html"
          cta="Open speech demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/subtitles"
          title="Timed-text demo"
          description="Roundtrip VTT settings, inspect cue-level validation, and verify that overlap detection and word timings survive edits."
          href="/subtitles.html"
          cta="Open subtitles demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/ui"
          title="Interactive UI gallery"
          description="Buttons, form controls, overlays, data display, theme switching, and notification flows built directly from the shared UI package."
          href="/ui.html"
          cta="Open UI examples"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/storytelling"
          title="Scroll-driven story demo"
          description="A full-page narrative sequence that exercises story container layout, sticky scene transitions, step navigation, and keyboard controls."
          href="/storytelling.html"
          cta="Open storytelling demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/word-prediction"
          title="Predictive typing demo"
          description="Train a next-word model on chat-like examples, then inspect live next-word suggestions and partial-word completions as you type."
          href="/word-prediction.html"
          cta="Open word prediction demo"
        />
        <ExampleLinkCard
          eyebrow="@moritzbrantner/word-vectors"
          title="Word vectors demo"
          description="Inspect distributional similarity, sparse context weights, and the document adapter that feeds semantic backoff for prediction."
          href="/word-vectors.html"
          cta="Open word vectors demo"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>How to use it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              The card games page is the fast visual smoke test: hover tilt should
              feel stable, foil and glass variants should stay legible, and the fan
              and stack layouts should still read well on small screens.
            </p>
            <p>
              The flat design page validates the new SVG scene package: palette
              swapping, layered vector composition, and animation helpers should all
              remain sharp without a canvas dependency.
            </p>
            <p>
              The maps page is the heavy-data manual smoke test: it exercises a
              six-figure dataset, zoom-aware aggregation, and click-to-expand cluster
              behavior inside a real browser map.
            </p>
            <p>
              Run <code>bun run dev:playground</code> from the workspace root. Vite
              aliases the packages to local source files, so edits in
              <code>packages/maps</code>, <code>packages/ui</code>, and
              <code>packages/storytelling</code> show up
              immediately.
            </p>
            <p>
              Use the theme toggle to check light and dark rendering. The example
              pages intentionally cover stateful components instead of only static
              screenshots.
            </p>
            <p>
              The parallel text page is useful for validating text-heavy package work:
              sentence grouping, hover state clarity, and responsiveness with long
              bilingual passages.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <a href="/card-games.html">Open card games package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/flat-design.html">Open flat design package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/linguistics-core.html">Open linguistics core package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/linguistics-corpus.html">Open linguistics corpus package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/linguistics-learning.html">Open linguistics learning package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/maps.html">Open maps package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/maps-motion.html">Open maps motion page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/parallel-text.html">Open parallel text package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/speed-reading.html">Open speed reading package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/speech.html">Open speech package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/subtitles.html">Open subtitles package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/ui.html">Open UI package page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/storytelling.html">Open storytelling page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/word-prediction.html">Open word prediction page</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/word-vectors.html">Open word vectors page</a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<HomePage />);
