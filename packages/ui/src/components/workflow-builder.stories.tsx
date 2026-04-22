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
    status: "success",
    x: 48,
    y: 80,
    outputs: [{ id: "documents", label: "Documents", kind: "document" }],
  },
  {
    id: "ocr",
    label: "OCR extract",
    description: "Run layout-aware text extraction.",
    status: "running",
    x: 340,
    y: 60,
    inputs: [{ id: "documents", label: "Documents", kind: "document", required: true }],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  },
  {
    id: "classify",
    label: "Classify",
    description: "Assign report categories.",
    x: 632,
    y: 138,
    inputs: [{ id: "text", label: "Text", kind: "text", required: true }],
    outputs: [{ id: "labels", label: "Labels", kind: "labels" }],
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
