import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  CitationExcerpt,
  CitationHeader,
  CitationItem,
  CitationList,
  CitationMarker,
  CitationMeta,
  CitationMetaItem,
  CitationReference,
  CitationStatusBadge,
  CitationTitle,
  type CitationData,
} from "..";

const citations = [
  {
    id: "paper",
    title: "Attention Is All You Need",
    authors: ["Vaswani", "Shazeer"],
    source: "NeurIPS",
    issued: "2017",
    locator: "section 3",
    url: "https://arxiv.org/abs/1706.03762",
    excerpt: "The Transformer allows for significantly more parallelization.",
    status: "supporting",
  },
  {
    id: "notes",
    title: "Evaluation notes",
    publisher: "Research Ops",
    accessed: "May 18, 2026",
    note: "Internal source used for methodology only.",
    status: "cited",
  },
] satisfies CitationData[];

describe("Citation", () => {
  test("renders data-driven citation lists with source metadata", () => {
    render(<CitationList citations={citations} data-testid="citations" />);

    const list = screen.getByTestId("citations");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(2);
    expect(screen.getByText("Attention Is All You Need")).toBeTruthy();
    expect(screen.getByText(/Vaswani/)).toBeTruthy();
    expect(screen.getByText(/Shazeer/)).toBeTruthy();
    expect(screen.getByText("NeurIPS")).toBeTruthy();
    expect(screen.getByText("section 3")).toBeTruthy();
    expect(
      screen.getByText("The Transformer allows for significantly more parallelization."),
    ).toBeTruthy();
    expect(screen.getByText("Supporting")).toBeTruthy();
  });

  test("renders linked titles and inline citation references", () => {
    render(
      <div>
        Source-grounded claim
        <CitationReference label="1" href="#paper" />
        <CitationList citations={citations} />
      </div>,
    );

    expect(screen.getByRole("link", { name: "1" }).getAttribute("href")).toBe("#paper");
    expect(
      screen.getByRole("link", { name: /Attention Is All You Need/ }).getAttribute("href"),
    ).toBe("https://arxiv.org/abs/1706.03762");
  });

  test("supports slot composition and forwarded class names", () => {
    render(
      <CitationList className="custom-list" data-testid="custom-list">
        <CitationItem className="custom-item">
          <CitationHeader>
            <CitationMarker>A</CitationMarker>
            <div>
              <CitationTitle>Manual citation</CitationTitle>
              <CitationMeta>
                <CitationMetaItem>Manual source</CitationMetaItem>
              </CitationMeta>
            </div>
            <CitationStatusBadge status="disputed" />
          </CitationHeader>
          <CitationExcerpt>Manual excerpt.</CitationExcerpt>
        </CitationItem>
      </CitationList>,
    );

    expect(screen.getByTestId("custom-list").className).toContain("custom-list");
    expect(screen.getByRole("listitem").className).toContain("custom-item");
    expect(screen.getByText("Manual citation")).toBeTruthy();
    expect(screen.getByText("Disputed")).toBeTruthy();
  });
});
