import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import * as React from "react";

import { AngleInput } from "./angle-input";

function ControlledAngleInputDemo() {
  const [value, setValue] = React.useState(225);

  return (
    <div className="w-full max-w-md">
      <AngleInput
        value={value}
        onValueChange={setValue}
        dialAriaLabel="Rotation angle"
        inputAriaLabel="Rotation degrees"
      />
    </div>
  );
}

const meta = {
  title: "Components/AngleInput",
  component: AngleInput,
  tags: ["autodocs", "test"],
  args: {
    defaultValue: 45,
    dialAriaLabel: "Rotation angle",
    inputAriaLabel: "Rotation degrees",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AngleInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const dial = canvas.getByRole("slider", { name: "Rotation angle" });

    await expect(dial).toHaveAttribute("aria-valuenow", "45");
    await userEvent.click(canvas.getByRole("button", { name: "Increase angle by 45 degrees" }));
    await expect(dial).toHaveAttribute("aria-valuenow", "90");
    await expect(canvas.getByRole("spinbutton", { name: "Rotation degrees" })).toBeVisible();
  },
};

export const Controlled: Story = {
  render: () => <ControlledAngleInputDemo />,
};
