import { useMemo, useState } from "react";

import {
  TimelineWorkbench,
  detectTimelineEditorOverlaps,
  findTimelineEditorItem,
  formatTimelineEditorTimeMs,
  getTimelineEditorDurationMs,
  normalizeTimelineEditorTracks,
  type TimelineEditorDocument,
  type TimelineWorkbenchAsset,
  type TimelineWorkbenchSelection,
} from "@moritzbrantner/timeline-editor";
import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const assets: TimelineWorkbenchAsset[] = [
  {
    id: "research-task",
    label: "Research pass",
    kind: "task",
    durationMs: 2_000,
    color: "#2563eb",
    description: "Planning item",
  },
  {
    id: "shoot-task",
    label: "Production block",
    kind: "production",
    durationMs: 3_000,
    color: "#0891b2",
    description: "Production item",
  },
  {
    id: "review-task",
    label: "Review pass",
    kind: "review",
    durationMs: 1_500,
    color: "#b45309",
    description: "Review item",
  },
];

const initialDocument: TimelineEditorDocument = {
  currentTimeMs: 1_000,
  durationMs: 12_000,
  markers: [
    { id: "kickoff", timeMs: 1_000, label: "Kickoff", color: "#2563eb" },
    { id: "handoff", timeMs: 7_000, label: "Handoff", color: "#b45309" },
  ],
  tracks: normalizeTimelineEditorTracks([
    {
      id: "planning",
      label: "Planning",
      acceptsItemKinds: ["task", "review"],
      items: [
        {
          id: "brief",
          trackId: "planning",
          label: "Brief",
          kind: "task",
          startMs: 500,
          durationMs: 2_500,
          color: "#2563eb",
        },
        {
          id: "outline",
          trackId: "planning",
          label: "Outline",
          kind: "task",
          startMs: 3_500,
          durationMs: 2_000,
          color: "#7c3aed",
        },
      ],
    },
    {
      id: "production",
      label: "Production",
      acceptsItemKinds: ["production"],
      items: [
        {
          id: "capture",
          trackId: "production",
          label: "Capture",
          kind: "production",
          startMs: 4_000,
          durationMs: 4_000,
          color: "#0891b2",
        },
      ],
    },
    {
      id: "review",
      label: "Review",
      acceptsItemKinds: ["review"],
      items: [
        {
          id: "qa",
          trackId: "review",
          label: "QA",
          kind: "review",
          startMs: 8_000,
          durationMs: 2_000,
          color: "#b45309",
        },
      ],
    },
  ]),
};

function TimelineEditorPage() {
  const [document, setDocument] = useState(initialDocument);
  const [selectedItemId, setSelectedItemId] = useState("brief");
  const durationMs = document.durationMs ?? getTimelineEditorDurationMs(document.tracks, 12_000);
  const selectedItem = selectedItemId
    ? findTimelineEditorItem(document.tracks, selectedItemId)?.item
    : undefined;
  const overlaps = useMemo(() => detectTimelineEditorOverlaps(document.tracks), [document.tracks]);

  function handleSelectionChange(selection: TimelineWorkbenchSelection) {
    setSelectedItemId(selection.itemId ?? "");
  }

  return (
    <PlaygroundPage
      activePage="timeline-editor"
      title="Generic timeline editor demo"
      description="Reusable time-aligned item editing with package-owned mutations and UI-package workbench primitives."
    >
      <section className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Tracks" value={document.tracks.length} />
          <SummaryCard
            label="Items"
            value={document.tracks.reduce((total, track) => total + track.items.length, 0)}
          />
          <SummaryCard
            label="Overlaps"
            value={overlaps.length}
            tone={overlaps.length ? "warn" : "ok"}
          />
          <SummaryCard label="Duration" value={formatTimelineEditorTimeMs(durationMs)} />
        </div>

        <Card className="rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Timeline workbench</CardTitle>
            <Badge variant="outline">
              {selectedItem
                ? `${selectedItem.label} · ${formatTimelineEditorTimeMs(selectedItem.durationMs)}`
                : "No selection"}
            </Badge>
          </CardHeader>
          <CardContent>
            <TimelineWorkbench
              document={document}
              selectedItemId={selectedItemId}
              pixelsPerSecond={88}
              snapMs={250}
              assets={assets}
              onDocumentChange={setDocument}
              onCurrentTimeChange={(timeMs) =>
                setDocument((current) => ({ ...current, currentTimeMs: timeMs }))
              }
              onSelectedItemChange={handleSelectionChange}
            />
          </CardContent>
        </Card>
      </section>
    </PlaygroundPage>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "warn";
}) {
  return (
    <Card
      className={cn(
        "rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10",
        tone === "warn" ? "border-destructive/40" : undefined,
      )}
    >
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

mountPage(<TimelineEditorPage />);
