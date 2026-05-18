import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  CitationExcerpt,
  CitationHeader,
  CitationItem,
  CitationList,
  CitationMarker,
  CitationMeta,
  CitationMetaItem,
  CitationNote,
  CitationReference,
  CitationStatusBadge,
  CitationTitle,
  type CitationData,
} from "./citation";

const citations = [
  {
    id: "paper",
    title: "Attention Is All You Need",
    authors: ["Vaswani", "Shazeer", "Parmar"],
    source: "NeurIPS",
    issued: "2017",
    locator: "section 3",
    url: "https://arxiv.org/abs/1706.03762",
    excerpt: "The Transformer allows for significantly more parallelization.",
    status: "supporting",
  },
  {
    id: "handbook",
    title: "Research synthesis handbook",
    authors: ["Platform Research"],
    publisher: "Internal Methods",
    issued: "2026",
    accessed: "May 18, 2026",
    note: "Use as methodological background, not as evidence for the factual claim.",
    status: "cited",
  },
  {
    id: "missing",
    title: "Dataset release notes",
    source: "Archive export",
    locator: "appendix B",
    status: "missing",
  },
] satisfies CitationData[];

function CitationPreview() {
  return (
    <div className="grid max-w-3xl gap-6">
      <p className="text-sm leading-6 text-foreground">
        Dense retrieval quality should be reviewed against source-grounded evidence
        <CitationReference label="1" href="#citation-paper" /> before changing ranking thresholds.
      </p>

      <CitationList citations={citations} />

      <CitationList compact>
        <CitationItem>
          <CitationHeader>
            <CitationMarker>A</CitationMarker>
            <div className="min-w-0">
              <CitationTitle>Custom citation layout</CitationTitle>
              <CitationMeta>
                <CitationMetaItem>Manual source</CitationMetaItem>
                <CitationMetaItem>p. 42</CitationMetaItem>
              </CitationMeta>
            </div>
            <CitationStatusBadge status="disputed" />
          </CitationHeader>
          <CitationExcerpt>Conflicting evidence needs explicit treatment.</CitationExcerpt>
          <CitationNote>Reviewer requested a stronger source.</CitationNote>
        </CitationItem>
      </CitationList>
    </div>
  );
}

const meta = {
  title: "Components/Citation",
  component: CitationPreview,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof CitationPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Attention Is All You Need")).toBeVisible();
    await expect(canvas.getByText("Research synthesis handbook")).toBeVisible();
    await expect(canvas.getByText("Custom citation layout")).toBeVisible();
    await expect(canvas.getByText("Disputed")).toBeVisible();
  },
};
