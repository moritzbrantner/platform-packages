import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@moritzbrantner/ui";

import {
  ExampleLinkCard,
  PlaygroundPage,
  playgroundExampleGroups,
  type PlaygroundExample,
  type PlaygroundExampleGroup,
} from "./app-shell";
import { mountPage } from "./mount";

const groupedExamples = playgroundExampleGroups
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => item.key !== "home"),
  }))
  .filter((group) => group.items.length > 0);

function HomePage() {
  return (
    <PlaygroundPage
      activePage="home"
      title="See the packages as working pages"
      description="This playground is a lightweight workspace app for validating package styling, interactive behavior, and composition across the exported surfaces."
    >
      <div className="grid gap-8">
        {groupedExamples.map((group) => (
          <ExampleGroupSection key={group.id} group={group} />
        ))}

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit px-3 py-1">
                Workflow
              </Badge>
              <CardTitle>How to use it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                Use the grouped navbar to jump between related package surfaces. Each page is a
                manual smoke test for package styling, responsive behavior, and stateful
                interactions.
              </p>
              <p>
                The maps pages cover both heavy clustering and temporal playback: the primary maps
                page validates six-figure aggregation, while the temporal maps playground isolates
                moving track behavior.
              </p>
              <p>
                Run <code>bun run dev:playground</code> from the workspace root. Vite aliases
                packages to local source files, so edits in
                <code>packages/maps</code>, <code>@moritzbrantner/ui</code>, and sibling package
                sources show up immediately.
              </p>
              <p>
                Use the theme toggle in the navigation bar to check light and dark rendering. The
                examples intentionally cover interactive states rather than only static screenshots.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
            <CardHeader>
              <Badge variant="secondary" className="w-fit px-3 py-1">
                Shortcuts
              </Badge>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {groupedExamples.map((group) => (
                <QuickLinkGroup key={group.id} group={group} />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </PlaygroundPage>
  );
}

function ExampleGroupSection({
  group,
}: {
  group: PlaygroundExampleGroup & { items: PlaygroundExample[] };
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit px-3 py-1">
            {group.eyebrow}
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">{group.label}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{group.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.items.map((item) => (
          <ExampleLinkCard
            key={item.key}
            eyebrow={item.eyebrow}
            title={item.title}
            description={item.description}
            href={item.href}
            cta={item.cta}
          />
        ))}
      </div>
    </section>
  );
}

function QuickLinkGroup({
  group,
}: {
  group: PlaygroundExampleGroup & { items: PlaygroundExample[] };
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {group.label}
      </p>
      <div className="grid gap-2">
        {group.items.map((item) => (
          <Button key={item.key} asChild variant="outline" className="justify-start">
            <a href={item.href}>{item.label}</a>
          </Button>
        ))}
      </div>
    </div>
  );
}

mountPage(<HomePage />);
