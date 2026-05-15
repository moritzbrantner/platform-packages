import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  ComponentEditorPanel,
  ComponentEditorProvider,
  EditableComponent,
  buildJsxSnippet,
  type EditableComponentDefinition,
} from "..";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const buttonDefinition: EditableComponentDefinition = {
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
    { id: "spacing", label: "Spacing", type: "slider", value: 2, min: 0, max: 8, step: 1 },
    { id: "color", label: "Color", type: "color", value: "#111111" },
    { id: "disabled", label: "Disabled", type: "boolean", value: false },
    { id: "className", label: "className", type: "className", value: "" },
  ],
  buildSnippet: (values) =>
    buildJsxSnippet({
      importName: "Button",
      importFrom: "@moritzbrantner/ui",
      props: {
        variant: values.variant,
        disabled: values.disabled,
        className: values.className,
      },
      children: "Save",
    }),
};

describe("@moritzbrantner/ui component editor", () => {
  async function chooseSelectOption(label: string, optionName: string) {
    const trigger = screen.getByLabelText(label);
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: optionName }));
  }

  test("generates deterministic JSX snippets", () => {
    expect(
      buildJsxSnippet({
        importName: "Button",
        importFrom: "@moritzbrantner/ui",
        props: { variant: "outline", disabled: true, className: undefined },
        children: "Save draft",
      }),
    ).toBe(
      'import { Button } from "@moritzbrantner/ui";\n\n<Button variant="outline" disabled={true}>\n  Save draft\n</Button>',
    );
  });

  test("selects components and edits select, slider, color, boolean, and className controls", async () => {
    render(
      <ComponentEditorProvider defaultSelectedId="button">
        <EditableComponent definition={buttonDefinition}>
          {(values) => (
            <div>
              <span>Variant: {String(values.variant)}</span>
              <span>Spacing: {String(values.spacing)}</span>
              <span>Color: {String(values.color)}</span>
              <span>Disabled: {String(values.disabled)}</span>
              <span>Class: {String(values.className)}</span>
            </div>
          )}
        </EditableComponent>
        <ComponentEditorPanel />
      </ComponentEditorProvider>,
    );

    await screen.findByRole("heading", { name: "Button" });

    await chooseSelectOption("Variant", "Outline");
    expect(await screen.findByText("Variant: outline")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Spacing value"), { target: { value: "6" } });
    expect(await screen.findByText("Spacing: 6")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Color color value"), { target: { value: "#ff0000" } });
    expect(await screen.findByText("Color: #ff0000")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Disabled"));
    expect(await screen.findByText("Disabled: true")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("className"), {
      target: { value: "rounded-md" },
    });
    expect(await screen.findByText("Class: rounded-md")).toBeTruthy();
    expect(screen.getByText(/variant="outline"/)).toBeTruthy();
    expect(screen.getByText(/className="rounded-md"/)).toBeTruthy();
  });

  test("copies snippets and resets values", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ComponentEditorProvider defaultSelectedId="button">
        <EditableComponent definition={buttonDefinition}>
          {(values) => <span>Variant: {String(values.variant)}</span>}
        </EditableComponent>
        <ComponentEditorPanel />
      </ComponentEditorProvider>,
    );

    await screen.findByRole("heading", { name: "Button" });
    await chooseSelectOption("Variant", "Outline");
    expect(await screen.findByText("Variant: outline")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Button")));

    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);
    expect(await screen.findByText("Variant: default")).toBeTruthy();
  });
});
