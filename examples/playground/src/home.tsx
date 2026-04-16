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
          eyebrow="@moritzbrantner/parallel-text"
          title="Parallel text comparison demo"
          description="Compare original and translated text side by side, hover tokens to inspect link mapping, and validate manual sentence alignment overrides."
          href="/parallel-text.html"
          cta="Open parallel text demo"
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
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>How to use it</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Run <code>pnpm dev:playground</code> from the workspace root. Vite
              aliases the packages to local source files, so edits in
              <code>packages/ui</code> and <code>packages/storytelling</code> show up
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
              <a href="/parallel-text.html">Open parallel text package page</a>
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
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<HomePage />);
