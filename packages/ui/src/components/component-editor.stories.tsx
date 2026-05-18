import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";

import { Button } from "./button";
import {
  ComponentEditorPanel,
  ComponentEditorPreviewFrame,
  ComponentEditorProvider,
  EditableComponent,
  buildJsxSnippet,
  type EditableComponentDefinition,
} from "./component-editor";

const buttonDefinition = {
  id: "button",
  label: "Button",
  importName: "Button",
  importFrom: "@moritzbrantner/ui",
  controls: [
    {
      id: "variant",
      label: "Variant",
      type: "select",
      value: "default",
      options: [
        { label: "Default", value: "default" },
        { label: "Outline", value: "outline" },
      ],
    },
    { id: "label", label: "Label", type: "text", value: "Save draft" },
    { id: "radius", label: "Radius", type: "slider", value: 8, min: 0, max: 24, step: 1 },
    { id: "background", label: "Background", type: "color", value: "#2563eb" },
    { id: "className", label: "className", type: "className", value: "" },
  ],
  buildSnippet: (values) =>
    buildJsxSnippet({
      importName: "Button",
      importFrom: "@moritzbrantner/ui",
      props: {
        variant: values.variant,
        className: values.className,
      },
      children: String(values.label),
    }),
} satisfies EditableComponentDefinition;

const meta = {
  title: "Components/ComponentEditor",
  component: ComponentEditorPanel,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <ComponentEditorProvider defaultSelectedId="button">
      <div className="grid min-h-screen gap-4 bg-background p-6 text-foreground lg:grid-cols-[1fr_24rem]">
        <EditableComponent definition={buttonDefinition}>
          {(values) => (
            <ComponentEditorPreviewFrame label="Button preview">
              <Button
                variant={values.variant as "default"}
                className={String(values.className ?? "")}
                style={{
                  backgroundColor: String(values.background),
                  borderRadius: Number(values.radius),
                  color: "#ffffff",
                }}
              >
                {String(values.label)}
              </Button>
            </ComponentEditorPreviewFrame>
          )}
        </EditableComponent>
        <ComponentEditorPanel />
      </div>
    </ComponentEditorProvider>
  ),
} satisfies Meta<typeof ComponentEditorPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const IntegrationEditor: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText("Variant"));
    await userEvent.click(await screen.findByRole("option", { name: "Outline" }));
    await expect(canvas.getByText(/variant="outline"/)).toBeInTheDocument();
  },
};
