import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayersIcon, PlayIcon, SettingsIcon } from "lucide-react";

import { Button } from "./button";
import { WorkbenchLayout } from "./workbench-layout";

function PanelContent({ title }: { title: string }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">Reusable panel slot for tool surfaces.</p>
    </div>
  );
}

function WorkbenchLayoutDemo() {
  return (
    <WorkbenchLayout
      toolbar={
        <>
          <Button size="sm">
            <PlayIcon />
            Run
          </Button>
          <Button variant="outline" size="sm">
            <SettingsIcon />
            Settings
          </Button>
        </>
      }
      leftPanel={<PanelContent title="Assets" />}
      rightPanel={<PanelContent title="Inspector" />}
      bottomPanel={<PanelContent title="Console" />}
    >
      <div className="grid min-h-80 place-items-center rounded-md border border-dashed border-border/70 bg-muted/25">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayersIcon className="size-4" />
          Canvas
        </div>
      </div>
    </WorkbenchLayout>
  );
}

const meta = {
  title: "Components/WorkbenchLayout",
  component: WorkbenchLayoutDemo,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof WorkbenchLayoutDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullWorkbench: Story = {};

export const CanvasOnly: Story = {
  render: () => (
    <WorkbenchLayout>
      <div className="grid min-h-64 place-items-center rounded-md border border-dashed">Canvas only</div>
    </WorkbenchLayout>
  ),
};
