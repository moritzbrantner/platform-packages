import { useMemo, useState } from "react";

import {
  WorkflowWorkbench,
  createWorkflowEditorGraphIndex,
  detectWorkflowEditorCycles,
  normalizeWorkflowEditorDocument,
  validateWorkflowEditorConnection,
  type WorkflowEditorDocument,
  type WorkflowEditorNodeTemplate,
  type WorkflowWorkbenchSelection,
} from "@moritzbrantner/workflow-editor";
import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const nodeTemplates: WorkflowEditorNodeTemplate[] = [
  {
    id: "input",
    label: "Input",
    kind: "source",
    category: "I/O",
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  },
  {
    id: "transform",
    label: "Transform",
    kind: "processor",
    category: "Compute",
    inputs: [{ id: "text", label: "Text", kind: "text" }],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  },
  {
    id: "decision",
    label: "Decision",
    kind: "router",
    category: "Logic",
    inputs: [{ id: "text", label: "Text", kind: "text" }],
    outputs: [
      { id: "pass", label: "Pass", kind: "text" },
      { id: "review", label: "Review", kind: "text" },
    ],
  },
  {
    id: "output",
    label: "Output",
    kind: "sink",
    category: "I/O",
    inputs: [{ id: "text", label: "Text", kind: "text" }],
  },
];

const initialDocument: WorkflowEditorDocument = normalizeWorkflowEditorDocument({
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: [
    {
      id: "input-1",
      label: "Input",
      kind: "source",
      category: "I/O",
      x: 40,
      y: 120,
      outputs: [{ id: "text", label: "Text", kind: "text" }],
    },
    {
      id: "transform-1",
      label: "Clean text",
      kind: "processor",
      category: "Compute",
      x: 300,
      y: 100,
      inputs: [{ id: "text", label: "Text", kind: "text" }],
      outputs: [{ id: "text", label: "Text", kind: "text" }],
    },
    {
      id: "decision-1",
      label: "Needs review?",
      kind: "router",
      category: "Logic",
      x: 560,
      y: 120,
      inputs: [{ id: "text", label: "Text", kind: "text" }],
      outputs: [
        { id: "pass", label: "Pass", kind: "text" },
        { id: "review", label: "Review", kind: "text" },
      ],
    },
    {
      id: "output-1",
      label: "Publish",
      kind: "sink",
      category: "I/O",
      x: 840,
      y: 80,
      inputs: [{ id: "text", label: "Text", kind: "text" }],
    },
  ],
  edges: [
    {
      id: "input-clean",
      sourceNodeId: "input-1",
      sourcePortId: "text",
      targetNodeId: "transform-1",
      targetPortId: "text",
    },
    {
      id: "clean-decision",
      sourceNodeId: "transform-1",
      sourcePortId: "text",
      targetNodeId: "decision-1",
      targetPortId: "text",
    },
    {
      id: "decision-output",
      sourceNodeId: "decision-1",
      sourcePortId: "pass",
      targetNodeId: "output-1",
      targetPortId: "text",
    },
  ],
});

function WorkflowEditorPage() {
  const [document, setDocument] = useState(initialDocument);
  const [selectedNodeId, setSelectedNodeId] = useState("input-1");
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const graphIndex = useMemo(() => createWorkflowEditorGraphIndex(document), [document]);
  const cycles = useMemo(() => detectWorkflowEditorCycles(document), [document]);
  const connectionChecks = [
    validateWorkflowEditorConnection(document, {
      sourceNodeId: "input-1",
      sourcePortId: "text",
      targetNodeId: "transform-1",
      targetPortId: "text",
    }),
    validateWorkflowEditorConnection(document, {
      sourceNodeId: "input-1",
      sourcePortId: "missing",
      targetNodeId: "output-1",
      targetPortId: "text",
    }),
    validateWorkflowEditorConnection(document, {
      sourceNodeId: "input-1",
      sourcePortId: "text",
      targetNodeId: "input-1",
      targetPortId: "text",
    }),
  ];

  function handleSelectionChange(selection: WorkflowWorkbenchSelection) {
    setSelectedNodeId(selection?.type === "node" ? selection.id : "");
    setSelectedEdgeId(selection?.type === "edge" ? selection.id : null);
  }

  return (
    <PlaygroundPage
      activePage="workflow-editor"
      title="Workflow graph editor demo"
      description="Node graph editing, connection validation, graph indexing, and inspector-driven updates from a reusable package."
    >
      <section className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Nodes" value={document.nodes.length} />
          <SummaryCard label="Edges" value={document.edges.length} />
          <SummaryCard
            label="Indexed edges"
            value={
              graphIndex.getSubgraph({ offset: 0, limit: document.nodes.length }).summary.edgeCount
            }
          />
          <SummaryCard label="Cycles" value={cycles.length} tone={cycles.length ? "warn" : "ok"} />
        </div>

        <Card className="rounded-none border-border/60 bg-background/75 shadow-2xl shadow-black/10">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Workflow workbench</CardTitle>
            <div className="flex flex-wrap gap-2">
              {connectionChecks.map((check, index) => (
                <Badge key={index} variant={check.valid ? "secondary" : "outline"}>
                  {check.valid ? "valid" : check.reason}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <WorkflowWorkbench
              document={document}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              nodeTemplates={nodeTemplates}
              onDocumentChange={setDocument}
              onSelectionChange={handleSelectionChange}
              onViewportChange={(viewport) => setDocument((current) => ({ ...current, viewport }))}
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

mountPage(<WorkflowEditorPage />);
