import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { ConnectionStatus } from "./connection-status";

const meta = {
  title: "Components/ConnectionStatus",
  component: ConnectionStatus,
  tags: ["autodocs", "test"],
  args: {
    status: "out-of-sync",
    onSync: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: ["connected", "synced", "disconnected", "out-of-sync"],
    },
  },
} satisfies Meta<typeof ConnectionStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-3 md:grid-cols-4">
      <ConnectionStatus status="connected" onSync={fn()} />
      <ConnectionStatus status="synced" onSync={fn()} />
      <ConnectionStatus status="disconnected" onReconnect={fn()} />
      <ConnectionStatus status="out-of-sync" onSync={fn()} />
    </div>
  ),
};

export const Reconnects: Story = {
  args: {
    status: "disconnected",
    onReconnect: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Disconnected/i }));

    await expect(args.onReconnect).toHaveBeenCalledTimes(1);
  },
};
