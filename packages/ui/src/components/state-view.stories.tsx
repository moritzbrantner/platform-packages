import type { Meta, StoryObj } from "@storybook/react-vite";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "./button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
  StateViewActions,
  StateViewDescription,
  StateViewTitle,
} from "./state-view";

const meta = {
  title: "Components/StateView",
  component: EmptyState,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => (
    <EmptyState>
      <StateViewTitle>No packages found</StateViewTitle>
      <StateViewDescription>Try adjusting your filters or search query.</StateViewDescription>
      <StateViewActions>
        <Button variant="outline" size="sm">
          Reset filters
        </Button>
      </StateViewActions>
    </EmptyState>
  ),
};

export const Loading: Story = {
  render: () => <LoadingState label="Loading package metadata" />,
};

export const Error: Story = {
  render: () => (
    <ErrorState>
      <StateViewTitle>Could not load packages</StateViewTitle>
      <StateViewDescription>The package registry returned an unavailable response.</StateViewDescription>
      <StateViewActions>
        <Button variant="destructive" size="sm">
          <RefreshCwIcon />
          Retry
        </Button>
      </StateViewActions>
    </ErrorState>
  ),
};

export const Offline: Story = {
  render: () => <OfflineState />,
};
