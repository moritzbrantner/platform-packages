import { useMemo } from "react";

import { ThemeProvider, useTheme } from "next-themes";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Toaster,
} from "@moritzbrantner/ui";

type PageKey =
  | "home"
  | "card-games"
  | "flat-design"
  | "linguistics-core"
  | "linguistics-corpus"
  | "linguistics-learning"
  | "maps"
  | "maps-motion"
  | "parallel-text"
  | "speed-reading"
  | "speech"
  | "subtitles"
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

const navigation = [
  { key: "home", href: "/index.html", label: "Overview" },
  { key: "card-games", href: "/card-games.html", label: "Card games package" },
  {
    key: "flat-design",
    href: "/flat-design.html",
    label: "Flat design package",
  },
  {
    key: "linguistics-core",
    href: "/linguistics-core.html",
    label: "Linguistics core",
  },
  {
    key: "linguistics-corpus",
    href: "/linguistics-corpus.html",
    label: "Linguistics corpus",
  },
  {
    key: "linguistics-learning",
    href: "/linguistics-learning.html",
    label: "Linguistics learning",
  },
  { key: "maps", href: "/maps.html", label: "Maps package" },
  { key: "maps-motion", href: "/maps-motion.html", label: "Maps motion demo" },
  {
    key: "parallel-text",
    href: "/parallel-text.html",
    label: "Parallel text package",
  },
  {
    key: "speed-reading",
    href: "/speed-reading.html",
    label: "Speed reading package",
  },
  { key: "speech", href: "/speech.html", label: "Speech package" },
  { key: "subtitles", href: "/subtitles.html", label: "Subtitles package" },
  { key: "ui", href: "/ui.html", label: "UI package" },
  {
    key: "storytelling",
    href: "/storytelling.html",
    label: "Storytelling package",
  },
  {
    key: "word-prediction",
    href: "/word-prediction.html",
    label: "Word prediction package",
  },
  {
    key: "word-vectors",
    href: "/word-vectors.html",
    label: "Word vectors package",
  },
] as const satisfies ReadonlyArray<{
  key: PageKey;
  href: string;
  label: string;
}>;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "Light mode" : "Dark mode"}
    </Button>
  );
}

function AppFrame({ activePage, title, description, children }: AppShellProps) {
  const activeLabel = useMemo(
    () =>
      navigation.find((item) => item.key === activePage)?.label ?? "Playground",
    [activePage],
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-none border border-border/60 bg-background/55 p-5 shadow-2xl shadow-black/10 supports-backdrop-filter:backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="px-3 py-1">
                Platform packages playground
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <nav
                className="flex flex-wrap gap-2"
                aria-label="Playground navigation"
              >
                {navigation.map((item) => (
                  <Button
                    key={item.key}
                    asChild
                    size="sm"
                    variant={item.key === activePage ? "default" : "outline"}
                  >
                    <a
                      href={item.href}
                      aria-current={
                        item.key === activePage ? "page" : undefined
                      }
                    >
                      {item.label}
                    </a>
                  </Button>
                ))}
              </nav>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span>{activeLabel}</span>
                <ThemeToggle />
              </div>
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
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
          <CardDescription className="max-w-xl text-sm leading-6">
            {description}
          </CardDescription>
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
