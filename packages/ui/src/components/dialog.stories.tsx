import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

type DialogDemoProps = {
  defaultOpen?: boolean;
};

function DialogDemo({ defaultOpen = false }: DialogDemoProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review component changes</DialogTitle>
          <DialogDescription>
            Confirm the release notes before publishing the package.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This dialog is rendered through a portal and can be tested from the document scope.
        </p>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: "Components/Dialog",
  component: DialogDemo,
  tags: ["autodocs", "test"],
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof DialogDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: {
    defaultOpen: true,
  },
};

export const OpensOnInteraction: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));

    await expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    await expect(screen.getByText("Review component changes")).toBeInTheDocument();
  },
};
