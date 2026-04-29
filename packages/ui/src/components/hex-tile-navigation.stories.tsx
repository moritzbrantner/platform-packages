import type { Meta, StoryObj } from "@storybook/react-vite";

import { HexTileNavigation, type HexTileNavigationItem } from "@moritzbrantner/three-starters";

const navigationItems = [
  {
    id: "brief",
    eyebrow: "Entry",
    label: "Project brief",
    description:
      "Anchor the space with the current mission, primary audience, and outcome framing.",
    meta: "01",
    accentColor: "#fb7185",
  },
  {
    id: "signals",
    eyebrow: "Research",
    label: "Signal scan",
    description: "Review user notes, telemetry, and examples before committing to the next path.",
    meta: "02",
    accentColor: "#f59e0b",
  },
  {
    id: "flows",
    eyebrow: "IA",
    label: "Route map",
    description:
      "Connect the major destinations and identify which hops need tighter narrative glue.",
    meta: "03",
    accentColor: "#22c55e",
  },
  {
    id: "states",
    eyebrow: "UX",
    label: "State matrix",
    description:
      "Compare calm, active, warning, and blocked states without losing the overall path.",
    meta: "04",
    accentColor: "#14b8a6",
  },
  {
    id: "handoff",
    eyebrow: "Build",
    label: "Implementation handoff",
    description:
      "Package the chosen route with copy, visual states, and keyboard behavior expectations.",
    meta: "05",
    accentColor: "#38bdf8",
  },
  {
    id: "qa",
    eyebrow: "Verify",
    label: "Interaction QA",
    description: "Walk the grid with click and keyboard navigation to catch gaps before release.",
    meta: "06",
    accentColor: "#818cf8",
  },
  {
    id: "ship",
    eyebrow: "Release",
    label: "Launch review",
    description:
      "Confirm the route still reads clearly when the system is under real content pressure.",
    meta: "07",
    accentColor: "#e879f9",
  },
  {
    id: "iterate",
    eyebrow: "Loop",
    label: "Iteration queue",
    description:
      "Capture the next improvements and keep the navigation surface evolving intentionally.",
    meta: "08",
    accentColor: "#f97316",
  },
] as const satisfies readonly HexTileNavigationItem[];

const meta = {
  title: "Recipes/Hex tile navigation",
  component: HexTileNavigation,
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Hex tile navigation playbook",
    description:
      "A 3D navigation surface for route planning, flow exploration, and keyboard-friendly destination switching.",
    items: navigationItems,
    columns: 4,
    rows: 2,
    canvasHeight: 420,
  },
  render: (args) => (
    <div className="min-h-screen bg-background px-6 py-8 text-foreground md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <HexTileNavigation {...args} />
      </div>
    </div>
  ),
} satisfies Meta<typeof HexTileNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlanningSurface: Story = {};
