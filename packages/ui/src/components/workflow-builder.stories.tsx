import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  WorkflowBuilder,
  type WorkflowBuilderEdge,
  type WorkflowBuilderNodeData,
} from "./workflow-builder";

const initialNodes: WorkflowBuilderNodeData[] = [
  {
    id: "ingest",
    label: "Ingest files",
    description: "Watch storage and normalize metadata.",
    category: "Source",
    packageLabel: "@platform/media",
    status: "success",
    tone: "success",
    tags: ["storage", "batch"],
    x: 48,
    y: 80,
    outputs: [
      {
        id: "documents",
        label: "Documents",
        kind: "document",
        description: "Structured file manifests with stable source paths.",
        badge: "batch",
      },
      {
        id: "assets",
        label: "Assets",
        kind: "asset",
        description: "Binary file references for layout and preview tasks.",
      },
    ],
  },
  {
    id: "ocr",
    label: "OCR extract",
    description: "Run layout-aware text extraction.",
    category: "Transform",
    packageLabel: "@platform/vision",
    status: "running",
    tone: "info",
    tags: ["gpu", "layout"],
    x: 340,
    y: 60,
    inputs: [
      {
        id: "documents",
        label: "Documents",
        kind: "document",
        required: true,
        description: "Incoming source batches for OCR extraction.",
      },
      {
        id: "assets",
        label: "Assets",
        kind: "asset",
        description: "Original image and PDF assets for visual extraction.",
      },
    ],
    outputs: [
      {
        id: "text",
        label: "Text",
        kind: "text",
        description: "Layout-aware OCR output with confidence spans.",
      },
      {
        id: "pages",
        label: "Pages",
        kind: "page",
        description: "Page images and positional layout blocks.",
      },
    ],
  },
  {
    id: "classify",
    label: "Classify",
    description: "Assign report categories.",
    category: "AI",
    packageLabel: "@platform/classification",
    tags: ["taxonomy", "routing"],
    x: 632,
    y: 138,
    inputs: [
      {
        id: "text",
        label: "Text",
        kind: "text",
        required: true,
        description: "Normalized content ready for taxonomy assignment.",
      },
      {
        id: "pages",
        label: "Pages",
        kind: "page",
        description: "Page context used for evidence links.",
      },
    ],
    outputs: [
      {
        id: "labels",
        label: "Labels",
        kind: "labels",
        description: "Resolved taxonomy labels and confidence scores.",
      },
      {
        id: "review",
        label: "Review",
        kind: "task",
        description: "Human review tasks for low-confidence categories.",
      },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    description: "Compact terminal node for downstream delivery.",
    category: "Sink",
    packageLabel: "@platform/delivery",
    variant: "compact",
    x: 940,
    y: 156,
    inputs: [
      {
        id: "labels",
        label: "Labels",
        kind: "labels",
        required: true,
      },
    ],
    outputs: [
      {
        id: "event",
        label: "Webhook",
        kind: "event",
      },
    ],
  },
];

const initialEdges: WorkflowBuilderEdge[] = [
  {
    id: "ingest-ocr",
    sourceNodeId: "ingest",
    sourcePortId: "documents",
    targetNodeId: "ocr",
    targetPortId: "documents",
    status: "success",
  },
  {
    id: "ingest-assets-ocr",
    sourceNodeId: "ingest",
    sourcePortId: "assets",
    targetNodeId: "ocr",
    targetPortId: "assets",
    status: "success",
  },
  {
    id: "ocr-classify",
    sourceNodeId: "ocr",
    sourcePortId: "text",
    targetNodeId: "classify",
    targetPortId: "text",
    status: "running",
  },
  {
    id: "ocr-pages-classify",
    sourceNodeId: "ocr",
    sourcePortId: "pages",
    targetNodeId: "classify",
    targetPortId: "pages",
  },
  {
    id: "classify-publish",
    sourceNodeId: "classify",
    sourcePortId: "labels",
    targetNodeId: "publish",
    targetPortId: "labels",
  },
];

const meta = {
  title: "Components/WorkflowBuilder",
  component: WorkflowBuilder,
  tags: ["autodocs", "test"],
  args: {
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: fn(),
    onEdgesChange: fn(),
    onSelectionChange: fn(),
  },
} satisfies Meta<typeof WorkflowBuilder>;

export default meta;

type Story = StoryObj<typeof meta>;

function WorkflowBuilderDemo(args: React.ComponentProps<typeof WorkflowBuilder>) {
  const [nodes, setNodes] = React.useState(initialNodes);
  const [edges, setEdges] = React.useState(initialEdges);

  return (
    <WorkflowBuilder
      {...args}
      nodes={nodes}
      edges={edges}
      onNodesChange={(nextNodes) => {
        setNodes(nextNodes);
        args.onNodesChange?.(nextNodes);
      }}
      onEdgesChange={(nextEdges) => {
        setEdges(nextEdges);
        args.onEdgesChange?.(nextEdges);
      }}
    />
  );
}

export const AiWorkflowGraph: Story = {
  render: (args) => <WorkflowBuilderDemo {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "OCR extract" }));
    await expect(args.onSelectionChange).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await expect(canvas.getByText("110%")).toBeInTheDocument();
  },
};

export const ReadOnly: Story = {
  render: (args) => <WorkflowBuilderDemo {...args} readOnly />,
};
