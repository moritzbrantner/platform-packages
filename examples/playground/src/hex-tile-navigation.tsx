import { useState } from "react";

import { HexTileNavigation, type HexTileNavigationItem } from "@moritzbrantner/three-starters";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const navigationItems = [
  {
    id: "landing",
    eyebrow: "Public",
    label: "Landing beacon",
    description:
      "Frame the product promise and guide first-time visitors toward the next relevant branch.",
    meta: "A1",
    accentColor: "#fb7185",
  },
  {
    id: "signals",
    eyebrow: "Research",
    label: "Signal intake",
    description:
      "Pull in behavioral notes, metrics, and qualitative findings before shifting the route.",
    meta: "B2",
    accentColor: "#f59e0b",
  },
  {
    id: "structure",
    eyebrow: "IA",
    label: "Structure map",
    description:
      "Lay out the major destinations so the surrounding route has a stable shared geometry.",
    meta: "C3",
    accentColor: "#84cc16",
  },
  {
    id: "states",
    eyebrow: "UX",
    label: "State gallery",
    description:
      "Compare calm, hovered, active, and blocked transitions on one coherent navigation surface.",
    meta: "D4",
    accentColor: "#14b8a6",
  },
  {
    id: "handoff",
    eyebrow: "Build",
    label: "Handoff packet",
    description: "Bundle layout, copy, keyboard rules, and state behavior for implementation.",
    meta: "E5",
    accentColor: "#38bdf8",
  },
  {
    id: "qa",
    eyebrow: "Verify",
    label: "Navigation QA",
    description:
      "Walk the grid with keyboard and pointer input to catch broken hops before release.",
    meta: "F6",
    accentColor: "#818cf8",
  },
  {
    id: "release",
    eyebrow: "Release",
    label: "Launch review",
    description:
      "Validate that the navigation still reads clearly once real content and edge cases land.",
    meta: "G7",
    accentColor: "#c084fc",
  },
  {
    id: "iterate",
    eyebrow: "Loop",
    label: "Iteration queue",
    description:
      "Capture follow-up opportunities and keep the route evolving with real usage data.",
    meta: "H8",
    accentColor: "#f97316",
  },
] as const satisfies readonly HexTileNavigationItem[];

function HexTileNavigationPage() {
  const [activeItemLabel, setActiveItemLabel] = useState<string>(
    navigationItems[0]?.label ?? "None",
  );

  return (
    <PlaygroundPage
      activePage="hex-tile-navigation"
      title="Hex tile navigation"
      description="A dedicated playground for the new `three-starters` honeycomb navigation surface, with click targets, keyboard traversal, and route detail panels."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_20rem]">
        <HexTileNavigation
          title="Honeycomb route planner"
          description="Use the 3D grid as a compact navigation map for a multi-step workflow, then inspect the selected destination below the scene."
          items={navigationItems}
          columns={4}
          rows={2}
          canvasHeight={460}
          onActiveItemChange={(item) => {
            setActiveItemLabel(item.label);
          }}
        />

        <div className="grid content-start gap-4">
          <Card className="rounded-[1.5rem] border-border/60 bg-background/70 shadow-xl shadow-black/10">
            <CardHeader className="space-y-3">
              <Badge variant="secondary" className="w-fit px-3 py-1">
                Live selection
              </Badge>
              <div className="space-y-2">
                <CardTitle>{activeItemLabel}</CardTitle>
                <CardDescription>
                  The active destination updates from tile clicks, arrow keys, or Q/W/E/A/S/D
                  movement.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Focus the navigation surface, then use the arrow keys or Q/W/E/A/S/D to walk to
                neighboring tiles.
              </p>
              <p>
                The 3D tile lift, ring marker, and detail card stay in sync with the current
                destination.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/60 bg-background/70 shadow-xl shadow-black/10">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit px-3 py-1">
                Usage notes
              </Badge>
              <div className="space-y-2">
                <CardTitle>Where it fits</CardTitle>
                <CardDescription>
                  This pattern works well for roadmap overviews, branching flows, destination
                  launchers, and spatial wayfinding.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Reserve empty cells for future states or use a full grid when every destination is
                active today.
              </p>
              <p>
                Because the scene is React Three Fiber based, product teams can layer in richer
                lights, animation, or scene props later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlaygroundPage>
  );
}

mountPage(<HexTileNavigationPage />);
