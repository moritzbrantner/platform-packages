import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  DocumentViewer,
  type DocumentViewerHighlight,
  type DocumentViewerPageData,
} from "./document-viewer";

const pages: DocumentViewerPageData[] = [
  {
    id: "page-1",
    pageNumber: 1,
    width: 612,
    height: 792,
    text: "Quarterly OCR report. Revenue increased in the enterprise dataset.",
  },
  {
    id: "page-2",
    pageNumber: 2,
    width: 612,
    height: 792,
    text: "Risk review found two invoices that require manual approval.",
  },
];

const highlights: DocumentViewerHighlight[] = [
  {
    id: "revenue",
    pageId: "page-1",
    label: "Revenue finding",
    color: "#2563eb",
    rects: [{ x: 0.18, y: 0.18, width: 0.34, height: 0.04 }],
  },
  {
    id: "invoice",
    pageId: "page-2",
    label: "Invoice review",
    color: "#16a34a",
    rects: [{ x: 0.16, y: 0.22, width: 0.46, height: 0.04 }],
  },
];

const meta = {
  title: "Components/DocumentViewer",
  component: DocumentViewer,
  tags: ["autodocs", "test"],
  args: {
    pages,
    highlights,
    onPageChange: fn(),
    onHighlightSelect: fn(),
  },
} satisfies Meta<typeof DocumentViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OcrReportViewer: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Search document"), "invoice");
    await expect(canvas.getByText("1 matches")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Page 2" }));
    await expect(args.onPageChange).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: "Document failed to load.",
  },
};
