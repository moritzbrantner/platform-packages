import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { WorkflowNode, getWorkflowNodeSize, type WorkflowNodeData } from "./workflow-node";

const classifierNode: WorkflowNodeData = {
  id: "classify",
  label: "Classify",
  category: "AI",
  packageLabel: "@moritzbrantner/text-classification",
  description: "Assign taxonomy labels from normalized workspace text.",
  kind: "labels",
  status: "running",
  tone: "info",
  tags: ["routing", "review"],
  inputs: [
    {
      id: "text",
      label: "Text",
      kind: "text",
      required: true,
      description: "Normalized OCR output.",
    },
  ],
  outputs: [
    {
      id: "labels",
      label: "Labels",
      kind: "labels",
      description: "Predicted taxonomy labels.",
    },
  ],
};

const compactPublishNode: WorkflowNodeData = {
  id: "publish",
  label: "Publish",
  description: "Forward workflow state to delivery channels.",
  variant: "compact",
  status: "success",
  outputs: [{ id: "event", label: "Webhook", kind: "event" }],
  inputs: [{ id: "labels", label: "Labels", kind: "labels" }],
};

const meta = {
  title: "Components/WorkflowNode",
  component: WorkflowNode,
  tags: ["autodocs", "test"],
  args: {
    node: classifierNode,
    onNodeSelect: fn(),
  },
} satisfies Meta<typeof WorkflowNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const expectedSize = getWorkflowNodeSize(args.node);
    await expect(canvas.getByRole("button", { name: "Classify" })).toBeVisible();
    await expect(canvas.getByText("@moritzbrantner/text-classification")).toBeVisible();
    await expect(canvas.getByText("running")).toBeVisible();
    await expect(canvas.getByText("routing")).toBeVisible();
    await expect(canvas.getByText("review")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Classify Text" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Classify Labels" })).toBeVisible();
    await expect(canvas.getByTestId("workflow-node-size")).toHaveTextContent(
      `${expectedSize.width}x${expectedSize.height}`,
    );

    await userEvent.click(canvas.getByRole("button", { name: "Classify" }));
    await expect(args.onNodeSelect).toHaveBeenCalledTimes(1);
  },
  render: (args) => (
    <div className="grid gap-4 p-4">
      <WorkflowNode {...args} />
      <span data-testid="workflow-node-size" className="text-sm text-muted-foreground">
        {`${getWorkflowNodeSize(args.node).width}x${getWorkflowNodeSize(args.node).height}`}
      </span>
    </div>
  ),
};

export const Compact: Story = {
  args: {
    node: compactPublishNode,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(canvas.getByText("labels to event")).toBeVisible();
  },
};
