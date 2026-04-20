import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

type FormControlsDemoProps = {
  disabled?: boolean;
};

function FormControlsDemo({ disabled = false }: FormControlsDemoProps) {
  return (
    <form className="grid w-[360px] gap-5">
      <div className="grid gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          disabled={disabled}
          placeholder="Research workspace"
          defaultValue="Platform package audit"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          disabled={disabled}
          placeholder="Add review notes"
          defaultValue="Check interactive states before release."
        />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="notify-team" disabled={disabled} />
        <Label htmlFor="notify-team">Notify team</Label>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-md border border-border/70 p-3">
        <Label htmlFor="auto-refresh">Auto refresh</Label>
        <Switch id="auto-refresh" disabled={disabled} />
      </div>
      <Button type="submit" disabled={disabled}>
        Save settings
      </Button>
    </form>
  );
}

const meta = {
  title: "Components/Form controls",
  component: FormControlsDemo,
  tags: ["autodocs", "test"],
  args: {
    disabled: false,
  },
} satisfies Meta<typeof FormControlsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  play: async ({ canvas, userEvent }) => {
    const nameInput = canvas.getByLabelText("Project name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Research hub");
    await expect(nameInput).toHaveValue("Research hub");

    const notifyCheckbox = canvas.getByRole("checkbox", { name: "Notify team" });
    await userEvent.click(notifyCheckbox);
    await expect(notifyCheckbox).toHaveAttribute("aria-checked", "true");

    const refreshSwitch = canvas.getByRole("switch", { name: "Auto refresh" });
    await userEvent.click(refreshSwitch);
    await expect(refreshSwitch).toHaveAttribute("aria-checked", "true");
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
