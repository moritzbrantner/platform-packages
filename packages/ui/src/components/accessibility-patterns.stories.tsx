import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";

import {
  ConstrainedWidthFixture,
  FocusableFixture,
  LongLabelFixture,
  ReducedMotionFixture,
} from "../test/a11y-fixtures";
import { Button } from "./button";
import { CommandPalette, type CommandPaletteGroup } from "./command-palette";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { SearchField } from "./search-field";
import { SelectionToolbar } from "./selection-toolbar";
import { EmptyState, StateViewDescription, StateViewTitle } from "./state-view";
import { WorkbenchLayout } from "./workbench-layout";

const commandGroups = [
  {
    id: "global",
    label: "Global",
    actions: [
      {
        id: "search",
        label: "Search",
        icon: <SearchIcon />,
      },
    ],
  },
] satisfies CommandPaletteGroup[];

function AccessibilityPatternsDemo() {
  return (
    <div className="grid gap-6">
      <ConstrainedWidthFixture>
        <SearchField defaultValue="package" resultCount={2} shortcut="/" />
      </ConstrainedWidthFixture>
      <ReducedMotionFixture>
        <SelectionToolbar selectedCount={2} totalCount={8}>
          <Button variant="outline" size="sm">
            Move
          </Button>
        </SelectionToolbar>
      </ReducedMotionFixture>
      <EmptyState>
        <StateViewTitle>Keyboard-ready state</StateViewTitle>
        <StateViewDescription>
          State surfaces keep useful text and action slots visible.
        </StateViewDescription>
      </EmptyState>
      <WorkbenchLayout
        toolbar={<FocusableFixture />}
        leftPanel={<LongLabelFixture />}
        rightPanel={<LongLabelFixture />}
      >
        <FocusableFixture />
      </WorkbenchLayout>
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible dialog fixture</DialogTitle>
            <DialogDescription>
              A fixture for checking focusable content inside an open dialog.
            </DialogDescription>
          </DialogHeader>
          <FocusableFixture />
        </DialogContent>
      </Dialog>
      <CommandPalette open groups={commandGroups} />
    </div>
  );
}

const meta = {
  title: "Patterns/Accessibility",
  component: AccessibilityPatternsDemo,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof AccessibilityPatternsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fixtures: Story = {};
