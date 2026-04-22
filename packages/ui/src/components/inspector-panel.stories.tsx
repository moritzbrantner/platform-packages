import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { InspectorPanel, type InspectorPanelSectionData } from "./inspector-panel";

const sections: InspectorPanelSectionData[] = [
  {
    id: "node",
    title: "Node",
    description: "Selected workflow-node properties.",
    fields: [
      { id: "label", label: "Label", type: "text", value: "OCR extract" },
      {
        id: "status",
        label: "Status",
        type: "select",
        value: "running",
        options: [
          { label: "Idle", value: "idle" },
          { label: "Running", value: "running" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
      { id: "retries", label: "Retries", type: "number", value: 2 },
      { id: "enabled", label: "Enabled", type: "boolean", value: true },
    ],
  },
  {
    id: "metadata",
    title: "Metadata",
    fields: [
      { id: "description", label: "Description", type: "textarea", value: "Extract document text." },
      { id: "config", label: "Config", type: "code", value: '{ "language": "deu+eng" }' },
    ],
  },
];

const meta = {
  title: "Components/InspectorPanel",
  component: InspectorPanel,
  tags: ["autodocs", "test"],
  args: {
    title: "OCR extract",
    description: "Workflow node inspector",
    sections,
    onValuesChange: fn(),
    onApply: fn(),
    onReset: fn(),
  },
} satisfies Meta<typeof InspectorPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectedWorkflowNodeInspector: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.clear(canvas.getByLabelText("Label"));
    await userEvent.type(canvas.getByLabelText("Label"), "OCR review");
    await expect(args.onValuesChange).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: /Apply/ }));
    await expect(args.onApply).toHaveBeenCalled();
  },
};

export const WithValidation: Story = {
  args: {
    validationMessages: {
      label: "Label is required.",
    },
  },
};
