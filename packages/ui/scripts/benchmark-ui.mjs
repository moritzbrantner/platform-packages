import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(
  packageRoot,
  "bench",
  "baselines",
  `${process.platform}-${process.arch}.json`,
);
const updateBaseline = process.argv.includes("--update");
const distEntry = path.join(packageRoot, "dist", "index.js");

if (!existsSync(distEntry)) {
  console.error("@moritzbrantner/ui benchmark requires dist/. Run `bun run build` first.");
  process.exit(1);
}

const ui = await import(distEntry);
const benchmarks = [
  benchmark("logic.cnMerge", "logic", () => {
    ui.cn(
      "px-2 py-1 text-sm bg-card text-foreground",
      "px-4",
      false && "hidden",
      "data-[state=open]:bg-accent",
    );
  }),
  benchmark("logic.queryBuilderEvaluate1000", "logic", () => {
    const fields = [
      { id: "name", label: "Name", type: "text" },
      { id: "score", label: "Score", type: "number" },
      { id: "status", label: "Status", type: "select" },
    ];
    const expression = {
      id: "root",
      combinator: "and",
      rules: [
        { id: "name", fieldId: "name", operator: "contains", value: "alpha" },
        { id: "score", fieldId: "score", operator: "gte", value: 500 },
        {
          id: "group",
          combinator: "or",
          rules: [
            { id: "ready", fieldId: "status", operator: "eq", value: "ready" },
            { id: "blocked", fieldId: "status", operator: "neq", value: "archived" },
          ],
        },
      ],
    };
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      name: index % 2 === 0 ? `alpha-${index}` : `beta-${index}`,
      score: index,
      status: index % 3 === 0 ? "ready" : "blocked",
    }));

    for (const row of rows) {
      ui.evaluateQueryBuilderExpression(expression, row, fields);
    }
  }),
  benchmark("logic.workflowConnectionValidation", "logic", () => {
    const nodes = Array.from({ length: 200 }, (_, index) => ({
      id: `node-${index}`,
      label: `Node ${index}`,
      x: index * 12,
      y: index * 6,
      inputs: [{ id: "in", label: "Input", kind: "text" }],
      outputs: [{ id: "out", label: "Output", kind: "text" }],
    }));
    const edges = Array.from({ length: 400 }, (_, index) => ({
      id: `edge-${index}`,
      sourceNodeId: `node-${index % 199}`,
      sourcePortId: "out",
      targetNodeId: `node-${(index + 1) % 199}`,
      targetPortId: "in",
    }));

    ui.getWorkflowBuilderConnectionValidity({
      nodes,
      edges,
      sourceNodeId: "node-10",
      sourcePortId: "out",
      targetNodeId: "node-150",
      targetPortId: "in",
    });
  }),
  benchmark("logic.timelineHelpers1000", "logic", () => {
    const tracks = [
      {
        id: "main",
        label: "Main",
        clips: Array.from({ length: 1000 }, (_, index) => ({
          id: `clip-${index}`,
          label: `Clip ${index}`,
          start: index * 1.25,
          end: index * 1.25 + 0.75,
        })),
      },
    ];

    ui.moveTimelineEditorClip(tracks, "clip-250", 375, { duration: 2000, snapInterval: 0.25 });
    ui.resizeTimelineEditorClip(tracks, "clip-500", "end", 630, {
      duration: 2000,
      snapInterval: 0.25,
    });
  }),
  benchmark("render.dataGrid100", "render", () => {
    renderUi(
      React.createElement(ui.DataGrid, {
        columns: [
          { accessorKey: "name", header: "Name" },
          { accessorKey: "amount", header: "Amount" },
          { accessorKey: "status", header: "Status" },
        ],
        data: createRows(100),
      }),
    );
  }),
  benchmark("render.dataGrid1000", "render", () => {
    renderUi(
      React.createElement(ui.DataGrid, {
        columns: [
          { accessorKey: "name", header: "Name" },
          { accessorKey: "amount", header: "Amount" },
          { accessorKey: "status", header: "Status" },
        ],
        data: createRows(1000),
      }),
    );
  }),
  benchmark("render.calendar100Events", "render", () => {
    renderUi(
      React.createElement(ui.Calendar, {
        defaultMonth: new Date(2026, 3, 1),
        mode: "single",
        showOutsideDays: false,
        icsData: createCalendarData(100),
      }),
    );
  }),
  benchmark("render.documentViewer100Pages", "render", () => {
    renderUi(
      React.createElement(ui.DocumentViewer, {
        pages: Array.from({ length: 100 }, (_, index) => ({
          id: `page-${index + 1}`,
          pageNumber: index + 1,
          width: 300,
          height: 420,
          text: `Invoice page ${index + 1} includes revenue and exception details.`,
        })),
      }),
    );
  }),
];

const results = {};

for (const runBenchmark of benchmarks) {
  const result = runBenchmark();
  results[result.name] = result;
  console.log(`${result.name}: median ${result.median.toFixed(3)}ms, p95 ${result.p95.toFixed(3)}ms`);
}

if (updateBaseline) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(`${baselinePath}`, `${JSON.stringify({ results }, null, 2)}\n`);
  console.log(`Updated benchmark baseline: ${path.relative(packageRoot, baselinePath)}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`Missing benchmark baseline ${path.relative(packageRoot, baselinePath)}.`);
  console.error("Run `bun run bench:update` after reviewing the current benchmark results.");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const errors = [];

for (const [name, result] of Object.entries(results)) {
  const baselineResult = baseline.results?.[name];

  if (!baselineResult) {
    errors.push(`${name}: missing baseline result`);
    continue;
  }

  const tolerance = result.kind === "logic" ? 1.25 : 1.4;
  const noiseFloorMs = result.kind === "logic" ? 0.75 : 5;
  const allowedMedian = Math.max(baselineResult.median * tolerance, baselineResult.median + noiseFloorMs);

  if (result.median > allowedMedian) {
    errors.push(
      `${name}: median ${result.median.toFixed(3)}ms exceeds allowed ${allowedMedian.toFixed(3)}ms`,
    );
  }
}

if (errors.length > 0) {
  console.error("@moritzbrantner/ui benchmark verification failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log("@moritzbrantner/ui benchmarks verified");

function benchmark(name, kind, callback) {
  return () => {
    const samples = [];

    for (let index = 0; index < 5; index += 1) {
      callback();
    }

    for (let index = 0; index < 30; index += 1) {
      const start = performance.now();
      callback();
      samples.push(performance.now() - start);
    }

    samples.sort((left, right) => left - right);

    return {
      kind,
      name,
      median: percentile(samples, 0.5),
      p95: percentile(samples, 0.95),
    };
  };
}

function renderUi(element) {
  const document = ensureDomGlobals().document;
  const container = document.createElement("div");

  document.body.append(container);

  const root = createRoot(container);

  flushSync(() => {
    root.render(element);
  });
  flushSync(() => {
    root.unmount();
  });

  container.remove();
}

function ensureDomGlobals() {
  if (globalThis.window?.document) {
    return globalThis.window;
  }

  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "http://127.0.0.1/",
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;

  return dom.window;
}

function createRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Account ${index}`,
    amount: index * 37,
    status: index % 2 === 0 ? "paid" : "pending",
  }));
}

function createCalendarData(count) {
  return [
    "vcalendar",
    [
      ["version", {}, "text", "2.0"],
      ["prodid", {}, "text", "-//platform-packages//UI Benchmark//EN"],
    ],
    Array.from({ length: count }, (_, index) => [
      "vevent",
      [
        ["uid", {}, "text", `event-${index}`],
        ["summary", {}, "text", `Event ${index}`],
        ["dtstart", {}, "date", `2026-04-${String((index % 28) + 1).padStart(2, "0")}`],
        ["dtend", {}, "date", `2026-04-${String((index % 28) + 2).padStart(2, "0")}`],
      ],
      [],
    ]),
  ];
}

function percentile(samples, value) {
  const index = Math.min(samples.length - 1, Math.floor(samples.length * value));

  return samples[index] ?? 0;
}
