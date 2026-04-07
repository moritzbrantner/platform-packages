import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";
import {
  StoryContainer,
  StoryScene,
  StorySeries,
} from "@moritzbrantner/storytelling";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

function StorytellingPage() {
  return (
    <PlaygroundPage
      activePage="storytelling"
      title="Storytelling package examples"
      description="A full-page demo for the scroll-based storytelling primitives. Use the scrollable story panel, step buttons, reset action, or arrow keys to validate how scenes animate and stay in sync."
    >
      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              Test checklist
            </Badge>
            <CardTitle>What this page exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Scroll to move through scenes and confirm the active step indicator stays synchronized.</p>
            <p>Use the step buttons or the keyboard arrows to jump between scenes without touching the scroll wheel.</p>
            <p>Toggle themes from the page header to check card contrast, sticky viewport rendering, and motion readability.</p>
            <Button asChild variant="outline">
              <a href="/ui.html">Compare with UI package page</a>
            </Button>
          </CardContent>
        </Card>

        <StoryContainer
          title="How a package idea becomes a shipped experience"
          subtitle="A four-step narrative built from @moritzbrantner/storytelling."
          instructions="Scroll inside the story, click the numbered steps, or use the arrow keys while the story region is focused."
        >
          <StorySeries ariaLabel="Package development story">
            <StoryScene id="idea" eyebrow="Step 1" title="Start with a single sharp package boundary">
              <p>
                The useful extraction is rarely “all shared code.” It is the smallest
                runtime surface that can evolve without dragging application-specific
                assumptions along with it.
              </p>
              <p>
                In practice that means building a package around a real interface:
                UI primitives, a storytelling engine, or another cohesive runtime
                capability.
              </p>
            </StoryScene>

            <StoryScene id="compose" eyebrow="Step 2" title="Prove composition with a real page">
              <p>
                Static unit tests are necessary, but they do not expose visual regressions,
                layering bugs, or awkward interaction edges. A focused playground page does.
              </p>
              <p>
                That is why this workspace now includes a dedicated example app instead of
                only package-level build and test commands.
              </p>
            </StoryScene>

            <StoryScene id="iterate" eyebrow="Step 3" title="Iterate against package source, not a published tarball">
              <p>
                The example app resolves the packages directly to local source files. That
                keeps the feedback loop short and makes it obvious when a styling or runtime
                change breaks the package contract.
              </p>
              <p>
                Tailwind source scanning is wired for package development too, so utility
                classes from the package source stay available during edits.
              </p>
            </StoryScene>

            <StoryScene id="ship" eyebrow="Step 4" title="Ship only after interaction quality holds up">
              <p>
                Scroll behavior, keyboard navigation, theme contrast, overlays, charts, and
                form states should all feel correct before a release is cut. The package API
                matters, but the working experience matters more.
              </p>
              <p>
                Use this page as a manual smoke test whenever the storytelling primitives or
                shared UI foundations change.
              </p>
            </StoryScene>
          </StorySeries>
        </StoryContainer>
      </section>
    </PlaygroundPage>
  );
}

mountPage(<StorytellingPage />);
