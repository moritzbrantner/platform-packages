import { useMemo } from "react";

import { ThemeProvider, useTheme } from "next-themes";

import {
  AccountMenu,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  NotificationMenu,
  PlatformNavbar,
  ThemeModeSwitch,
  type PlatformNavbarGroup,
  Toaster,
} from "@moritzbrantner/ui";

export type PageKey =
  | "hex-tile-navigation"
  | "home"
  | "card-games"
  | "data-density"
  | "flat-design"
  | "linguistics-core"
  | "linguistics-corpus"
  | "linguistics-learning"
  | "maps"
  | "map-edge-cases"
  | "media-editor"
  | "navbars"
  | "parallel-text"
  | "speed-reading"
  | "speech"
  | "subtitles"
  | "temporal-maps"
  | "ui"
  | "storytelling"
  | "word-prediction"
  | "word-vectors";

type AppShellProps = {
  activePage: PageKey;
  title: string;
  description: string;
  children: React.ReactNode;
};

export type PlaygroundExample = {
  key: PageKey;
  href: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  navDescription: string;
  badge?: string;
};

export type PlaygroundExampleGroup = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  items: readonly PlaygroundExample[];
};

export const playgroundExampleGroups: readonly PlaygroundExampleGroup[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Start",
    description: "Entry points and shared UI surfaces.",
    items: [
      {
        key: "home",
        href: "/index.html",
        label: "Overview",
        eyebrow: "Playground",
        title: "Package playground overview",
        description:
          "Browse every package demo from a grouped landing page that mirrors the shared navigation.",
        cta: "Open overview",
        navDescription: "Grouped index of package examples.",
      },
      {
        key: "ui",
        href: "/ui.html",
        label: "UI package",
        eyebrow: "@moritzbrantner/ui",
        title: "Interactive UI gallery",
        description:
          "Buttons, form controls, overlays, data display, theme switching, and notification flows built directly from the shared UI package.",
        cta: "Open UI examples",
        navDescription: "Shared primitives, layouts, and controls.",
      },
      {
        key: "navbars",
        href: "/navbars.html",
        label: "Navbar testcase",
        eyebrow: "@moritzbrantner/ui",
        title: "Navbar testcase",
        description:
          "Mobile, web, and desktop navbar variants share one typed component with animated glass submenus from the UI package.",
        cta: "Open navbar testcase",
        navDescription: "PlatformNavbar variants and menu behavior.",
      },
    ],
  },
  {
    id: "maps",
    label: "Maps",
    eyebrow: "Geospatial",
    description: "Clustered, temporal, heat, and edge-case map scenarios.",
    items: [
      {
        key: "maps",
        href: "/maps.html",
        label: "Maps package",
        eyebrow: "@moritzbrantner/maps",
        title: "Large-scale maps demo",
        description:
          "Pan and zoom through 100,000 synthetic delivery points, watch client-side cluster totals update live, and inspect how single points reappear at close zoom.",
        cta: "Open maps demo",
        navDescription: "Zoom-aware clustering and viewport totals.",
      },
      {
        key: "temporal-maps",
        href: "/temporal-maps.html",
        label: "Temporal maps",
        eyebrow: "@moritzbrantner/maps",
        title: "Temporal maps playground",
        description:
          "Render 10,000 dots on a dedicated timeline page, keep 5,000 fixed in place, and drive 5,000 along seeded random routes.",
        cta: "Open temporal maps",
        navDescription: "Timeline playback with static and moving tracks.",
        badge: "New",
      },
      {
        key: "map-edge-cases",
        href: "/map-edge-cases.html",
        label: "Map edge cases",
        eyebrow: "@moritzbrantner/maps",
        title: "Map edge-case lab",
        description:
          "Stress the maps package with dateline-adjacent points, duplicate coordinates, filtered clusters, weighted heat maps, invalid records, and sparse temporal signals.",
        cta: "Open edge-case lab",
        navDescription: "Dateline, duplicate, weighted, and sparse temporal cases.",
        badge: "New",
      },
    ],
  },
  {
    id: "visual-data",
    label: "Visual & data",
    eyebrow: "Surfaces",
    description: "Density, storytelling, card, and illustration packages.",
    items: [
      {
        key: "hex-tile-navigation",
        href: "/hex-tile-navigation.html",
        label: "Hex navigation",
        eyebrow: "@moritzbrantner/three-starters",
        title: "Hex tile navigation demo",
        description:
          "Explore a 3D honeycomb navigation surface with clickable tiles, keyboard movement, and destination details for route planning.",
        cta: "Open hex navigation demo",
        navDescription: "Interactive honeycomb destination grid.",
        badge: "New",
      },
      {
        key: "data-density",
        href: "/data-density.html",
        label: "Data density package",
        eyebrow: "@moritzbrantner/data-density",
        title: "Dense data indexing demo",
        description:
          "Query ordered row windows, chart-sized numeric bins, and viewport-aware geo aggregation while preserving metric totals for dashboards.",
        cta: "Open data-density demo",
        navDescription: "Virtual rows, bins, and geo summaries.",
      },
      {
        key: "flat-design",
        href: "/flat-design.html",
        label: "Flat design package",
        eyebrow: "@moritzbrantner/flat-design",
        title: "Flat-design scene demo",
        description:
          "Build layered SVG illustrations, swap palettes, and inspect looping flat-motion presets rendered from the new scene schema.",
        cta: "Open flat-design demo",
        navDescription: "Scene schema, palettes, and SVG motion.",
      },
      {
        key: "storytelling",
        href: "/storytelling.html",
        label: "Storytelling package",
        eyebrow: "@moritzbrantner/storytelling",
        title: "Scroll-driven story demo",
        description:
          "A full-page narrative sequence that exercises story container layout, sticky scene transitions, step navigation, and keyboard controls.",
        cta: "Open storytelling demo",
        navDescription: "Sticky scenes and narrative controls.",
      },
      {
        key: "card-games",
        href: "/card-games.html",
        label: "Card games package",
        eyebrow: "@moritzbrantner/card-games",
        title: "Card game visuals demo",
        description:
          "Inspect hover tilt, foil/glass finishes, fanned player hands, stacked decks, and themed table surfaces with responsive layout.",
        cta: "Open card games demo",
        navDescription: "Card finishes, hands, decks, and tables.",
      },
    ],
  },
  {
    id: "language",
    label: "Language",
    eyebrow: "Text",
    description: "Linguistics, bilingual text, prediction, and vector demos.",
    items: [
      {
        key: "linguistics-core",
        href: "/linguistics-core.html",
        label: "Linguistics core",
        eyebrow: "@moritzbrantner/linguistics-core",
        title: "Linguistics core demo",
        description:
          "Inspect Unicode normalization, multilingual segmentation, and span re-anchoring with the shared text-document model.",
        cta: "Open linguistics core demo",
        navDescription: "Normalization, segmentation, and spans.",
      },
      {
        key: "linguistics-corpus",
        href: "/linguistics-corpus.html",
        label: "Linguistics corpus",
        eyebrow: "@moritzbrantner/linguistics-corpus",
        title: "Corpus indexing demo",
        description:
          "Run metadata-aware search, inspect concordance windows, and compare multilingual frequency tables over in-memory documents.",
        cta: "Open corpus demo",
        navDescription: "Corpus search and concordance windows.",
      },
      {
        key: "linguistics-learning",
        href: "/linguistics-learning.html",
        label: "Linguistics learning",
        eyebrow: "@moritzbrantner/linguistics-learning",
        title: "Learning helpers demo",
        description:
          "Derive study terms, generate flashcards, and inspect the spaced-repetition grading state produced from live text.",
        cta: "Open learning demo",
        navDescription: "Study terms, cards, and review state.",
      },
      {
        key: "parallel-text",
        href: "/parallel-text.html",
        label: "Parallel text package",
        eyebrow: "@moritzbrantner/parallel-text",
        title: "Parallel text comparison demo",
        description:
          "Compare original and translated text side by side, hover tokens to inspect link mapping, and validate manual sentence alignment overrides.",
        cta: "Open parallel text demo",
        navDescription: "Bilingual alignment and token links.",
      },
      {
        key: "word-prediction",
        href: "/word-prediction.html",
        label: "Word prediction package",
        eyebrow: "@moritzbrantner/word-prediction",
        title: "Predictive typing demo",
        description:
          "Train a next-word model on chat-like examples, then inspect live next-word suggestions and partial-word completions as you type.",
        cta: "Open word prediction demo",
        navDescription: "Next-word and partial-word suggestions.",
      },
      {
        key: "word-vectors",
        href: "/word-vectors.html",
        label: "Word vectors package",
        eyebrow: "@moritzbrantner/word-vectors",
        title: "Word vectors demo",
        description:
          "Inspect distributional similarity, sparse context weights, and the corpus adapter that feeds semantic backoff for prediction.",
        cta: "Open word vectors demo",
        navDescription: "Similarity, sparse weights, and adapters.",
      },
    ],
  },
  {
    id: "media",
    label: "Media",
    eyebrow: "Tools",
    description: "Timeline, reading, speech, and timed-text demos.",
    items: [
      {
        key: "media-editor",
        href: "/media-editor.html",
        label: "Media editor package",
        eyebrow: "@moritzbrantner/media-editor",
        title: "Media editor timeline demo",
        description:
          "Arrange audio, video, and title clips on a zoomable timeline with draggable clips, trimming handles, scrubbing, selection, and drop targets.",
        cta: "Open media editor demo",
        navDescription: "Clip timeline, trimming, and scrubbing.",
      },
      {
        key: "speed-reading",
        href: "/speed-reading.html",
        label: "Speed reading package",
        eyebrow: "@moritzbrantner/speed-reading",
        title: "Speed reading OCR demo",
        description:
          "Paste any passage or upload a PDF, run cleanup on headers and page numbers, and drive an RSVP-style reader with live WPM controls.",
        cta: "Open speed reading demo",
        navDescription: "OCR cleanup and RSVP reading controls.",
      },
      {
        key: "speech",
        href: "/speech.html",
        label: "Speech package",
        eyebrow: "@moritzbrantner/speech",
        title: "Speech transcription demo",
        description:
          "Record from the microphone, upload chunks to a Whisper-style backend, and watch the returned transcript feed the predictive text model.",
        cta: "Open speech demo",
        navDescription: "Recording, chunk upload, and transcripts.",
      },
      {
        key: "subtitles",
        href: "/subtitles.html",
        label: "Subtitles package",
        eyebrow: "@moritzbrantner/subtitles",
        title: "Timed-text demo",
        description:
          "Roundtrip VTT settings, inspect cue-level validation, and verify that overlap detection and word timings survive edits.",
        cta: "Open subtitles demo",
        navDescription: "VTT roundtrip and cue validation.",
      },
    ],
  },
] as const;

export const playgroundExamples = playgroundExampleGroups.flatMap((group) => group.items);

function getPlaygroundExample(page: PageKey) {
  return playgroundExamples.find((item) => item.key === page) ?? playgroundExamples[0];
}

function getPlaygroundGroup(page: PageKey) {
  return playgroundExampleGroups.find((group) => group.items.some((item) => item.key === page));
}

function createNavbarGroups(activePage: PageKey): PlatformNavbarGroup[] {
  return playgroundExampleGroups.map((group) => ({
    description: group.description,
    eyebrow: group.eyebrow,
    id: group.id,
    items: group.items.map((item) => ({
      active: item.key === activePage,
      badge: item.badge,
      description: item.navDescription,
      href: item.href,
      id: item.key,
      label: item.label,
    })),
    label: group.label,
  }));
}

const playgroundFrameClassName = cn(
  "relative min-h-screen overflow-hidden px-4 py-8 md:px-8",
  "[background-image:radial-gradient(circle_at_15%_18%,color-mix(in_oklch,var(--primary)_18%,white)_0%,transparent_30%),radial-gradient(circle_at_85%_10%,color-mix(in_oklch,var(--chart-2)_16%,white)_0%,transparent_26%),linear-gradient(180deg,color-mix(in_oklch,var(--muted)_38%,white)_0%,var(--background)_42%)]",
  "dark:[background-image:radial-gradient(circle_at_15%_18%,color-mix(in_oklch,var(--primary)_24%,black)_0%,transparent_28%),radial-gradient(circle_at_82%_12%,color-mix(in_oklch,var(--chart-2)_18%,black)_0%,transparent_24%),linear-gradient(180deg,color-mix(in_oklch,var(--card)_72%,black)_0%,var(--background)_44%)]",
);

const playgroundGridClassName = cn(
  "pointer-events-none fixed inset-0 opacity-35",
  "[background-image:linear-gradient(to_right,color-mix(in_oklch,var(--border)_30%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_30%,transparent)_1px,transparent_1px)]",
  "[background-size:72px_72px]",
  "[mask-image:linear-gradient(180deg,rgba(0,0,0,0.25),transparent_82%)]",
);

function AppFrame({ activePage, title, description, children }: AppShellProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const navbarGroups = useMemo(() => createNavbarGroups(activePage), [activePage]);
  const activeExample = useMemo(() => getPlaygroundExample(activePage), [activePage]);
  const activeGroup = useMemo(() => getPlaygroundGroup(activePage), [activePage]);
  const themeMode = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className={playgroundFrameClassName}>
      <div aria-hidden="true" className={playgroundGridClassName} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-none border border-border/60 bg-background/55 p-5 shadow-2xl shadow-black/10 supports-backdrop-filter:backdrop-blur-xl">
          <div className="flex flex-col gap-5">
            <PlatformNavbar
              activeGroupId={activeGroup?.id}
              activeItemId={activePage}
              actions={
                <>
                  <NotificationMenu
                    unreadCount={2}
                    items={[
                      {
                        id: "workspace",
                        title: "Workspace updated",
                        description: "The playground package list was refreshed.",
                        unread: true,
                        meta: "2m",
                      },
                      {
                        id: "release",
                        title: "Release checks passed",
                        description: "UI package verification finished successfully.",
                        unread: true,
                        meta: "1h",
                      },
                    ]}
                  />
                  <ThemeModeSwitch mode={themeMode} onModeChange={setTheme} />
                  <AccountMenu
                    user={{
                      name: "Mira Brandt",
                      email: "mira@example.com",
                      initials: "MB",
                    }}
                    items={[
                      { id: "profile", label: "Profile" },
                      { id: "settings", label: "Settings" },
                      { id: "logout", label: "Sign out", destructive: true },
                    ]}
                  />
                </>
              }
              brand="Platform packages"
              className="max-w-none"
              groups={navbarGroups}
              variant="desktop"
            />
            <div className="space-y-3">
              <Badge variant="outline" className="px-3 py-1">
                {activeGroup?.label ?? "Playground"}
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  {description}
                </p>
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {activeExample?.label ?? "Playground"}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>

      <Toaster richColors closeButton />
    </div>
  );
}

export function PlaygroundPage(props: AppShellProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppFrame {...props} />
    </ThemeProvider>
  );
}

export function ExampleLinkCard({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="h-full rounded-none border-border/60 bg-background/55 shadow-2xl shadow-black/10">
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit px-3 py-1">
          {eyebrow}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex h-full items-end">
        <Button asChild className={cn("px-5")}>
          <a href={href}>{cta}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
