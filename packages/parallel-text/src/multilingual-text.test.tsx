import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MultilingualText, ParallelText } from "./multilingual-text";

describe("MultilingualText", () => {
  test("renders three aligned editions with stable segment anchors", () => {
    const { container } = render(
      <MultilingualText
        aria-label="Aquinas multilingual passage"
        columns={[
          { id: "la", label: "Latin", lang: "la" },
          { id: "en", label: "English", lang: "en" },
          { id: "de", label: "Deutsch", lang: "de" },
        ]}
        segments={[
          {
            id: "response-opening",
            cells: {
              la: "Respondeo dicendum quod Deum esse quinque viis probari potest.",
              en: "I answer that the existence of God can be proved in five ways.",
              de: "Ich antworte: Dass Gott ist, kann auf fünf Wegen bewiesen werden.",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Latin")).toBeTruthy();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Deutsch")).toBeTruthy();
    expect(container.querySelector("#response-opening")?.getAttribute("data-segment-id")).toBe(
      "response-opening",
    );
    expect(container.querySelector('[data-column-id="la"]')?.getAttribute("lang")).toBe("la");
  });

  test("preserves empty aligned cells without dropping the column", () => {
    render(
      <MultilingualText
        emptyCell={<span>Translation unavailable</span>}
        columns={[
          { id: "la", label: "Latin" },
          { id: "de", label: "Deutsch" },
        ]}
        segments={[
          {
            cells: {
              la: "Sed contra est quod dicitur...",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Translation unavailable")).toBeTruthy();
  });

  test("keeps the two-column ParallelText compatibility API", () => {
    const { container } = render(
      <ParallelText
        sourceLabel="Latin"
        targetLabel="English"
        sourceLang="la"
        targetLang="en"
        sourceDir="ltr"
        targetDir="ltr"
        segments={[
          {
            id: "segment-one",
            source: "Ens et essentia...",
            target: "Being and essence...",
          },
        ]}
      />,
    );

    expect(screen.getByText("Ens et essentia...")).toBeTruthy();
    expect(screen.getByText("Being and essence...")).toBeTruthy();
    expect(container.querySelector('[data-column-id="source"]')?.getAttribute("lang")).toBe("la");
    expect(container.querySelector('[data-column-id="target"]')?.getAttribute("lang")).toBe("en");
  });
});
