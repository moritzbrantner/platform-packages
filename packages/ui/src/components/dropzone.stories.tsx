import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, fn } from "storybook/test";

import {
  Dropzone,
  DropzoneContent,
  DropzoneDefaultIcon,
  DropzoneDescription,
  DropzoneIcon,
  DropzoneInput,
  DropzoneTitle,
} from "./dropzone";

type DropzoneDemoProps = {
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

function DropzoneDemo({ disabled = false, onChange }: DropzoneDemoProps) {
  return (
    <Dropzone htmlFor="artifact-upload" className="w-[360px]">
      <DropzoneInput
        id="artifact-upload"
        disabled={disabled}
        accept=".pdf,.md,.txt"
        onChange={onChange}
      />
      <DropzoneIcon>
        <DropzoneDefaultIcon />
      </DropzoneIcon>
      <DropzoneContent>
        <DropzoneTitle>Upload release artifact</DropzoneTitle>
        <DropzoneDescription>PDF, Markdown, or plain text files up to 10 MB.</DropzoneDescription>
      </DropzoneContent>
    </Dropzone>
  );
}

const meta = {
  title: "Components/Dropzone",
  component: DropzoneDemo,
  tags: ["autodocs", "test"],
  args: {
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof DropzoneDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText(/Upload release artifact/) as HTMLInputElement;
    const file = new File(["Release notes"], "release-notes.pdf", {
      type: "application/pdf",
    });

    await userEvent.upload(input, file);

    await expect(input.files?.[0]?.name).toBe("release-notes.pdf");
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
