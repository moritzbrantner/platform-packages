import { expect, test, type Page } from "@playwright/test";

// Acceptance smoke for every built playground entry page (examples/playground/vite.config.ts
// rollupOptions.input). Each page must render its title heading without uncaught page errors
// or console errors; map pages must also bring every map region to data-map-ready="true".
type PlaygroundPage = {
  path: string;
  heading: string;
  readyMaps?: readonly string[];
};

const PLAYGROUND_PAGES: readonly PlaygroundPage[] = [
  { path: "/index.html", heading: "See the packages as working pages" },
  { path: "/card-games.html", heading: "Card games package examples" },
  { path: "/data-density.html", heading: "Data density package examples" },
  { path: "/flat-design.html", heading: "Flat design editor" },
  { path: "/hex-tile-navigation.html", heading: "Hex tile navigation" },
  { path: "/linguistics-core.html", heading: "Linguistics core package examples" },
  { path: "/linguistics-corpus.html", heading: "Linguistics corpus package examples" },
  { path: "/linguistics-learning.html", heading: "Linguistics learning package examples" },
  {
    path: "/maps.html",
    heading: "Maps package with zoom-aware aggregation",
    readyMaps: ["Clustered delivery demand map", "Temporal courier activity map"],
  },
  {
    path: "/map-edge-cases.html",
    heading: "Map edge-case lab",
    readyMaps: [
      "Clustered operational edge map",
      "Metric-weighted incident density",
      "Sparse signal temporal heat map",
    ],
  },
  {
    path: "/maps-motion.html",
    heading: "Temporal maps playground",
    readyMaps: ["Temporal GeoJSON strategy preview", "Temporal motion map"],
  },
  {
    path: "/temporal-maps.html",
    heading: "Temporal maps playground",
    readyMaps: ["Temporal GeoJSON strategy preview", "Temporal motion map"],
  },
  { path: "/media-editor.html", heading: "Media editor timeline MVP" },
  { path: "/timeline-editor.html", heading: "Generic timeline editor demo" },
  { path: "/workflow-editor.html", heading: "Workflow graph editor demo" },
  { path: "/navbars.html", heading: "Navbar testcase" },
  { path: "/parallel-text.html", heading: "Parallel text package examples" },
  { path: "/speed-reading.html", heading: "Speed reading package playground" },
  { path: "/speech.html", heading: "Speech transcription package examples" },
  { path: "/subtitles.html", heading: "Subtitles package player" },
  { path: "/ui.html", heading: "UI package examples" },
  { path: "/storytelling.html", heading: "Storytelling package examples" },
  { path: "/word-prediction.html", heading: "Word prediction package examples" },
  { path: "/word-vectors.html", heading: "Word vectors package examples" },
];

for (const playgroundPage of PLAYGROUND_PAGES) {
  test(`renders ${playgroundPage.path} without page or console errors`, async ({ page }) => {
    const problems = collectPageProblems(page);

    await page.goto(playgroundPage.path);

    await expect(
      page.getByRole("heading", { level: 1, name: playgroundPage.heading, exact: true }),
    ).toBeVisible();

    await Promise.all(
      (playgroundPage.readyMaps ?? []).map((mapLabel) =>
        expect(page.locator(`[aria-label="${mapLabel}"][data-map-ready="true"]`)).toHaveCount(1),
      ),
    );

    await page.waitForLoadState("networkidle");

    expect(problems).toEqual([]);
  });
}

function collectPageProblems(page: Page) {
  const problems: string[] = [];

  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(`console.error: ${message.text()}`);
    }
  });

  return problems;
}
