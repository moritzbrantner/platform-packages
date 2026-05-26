import { existsSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(packageRoot, "dist", "index.js");

if (!existsSync(distEntry)) {
  console.error("@moritzbrantner/charts benchmark requires dist/. Run `bun run build` first.");
  process.exit(1);
}

const {
  createChartDensityIndex,
  createChartDensityViewportSummary,
  createProgressiveChartDensityIndex,
} = await import(distEntry);

const results = [];
const runFullMatrix = process.env.CHARTS_BENCH_FULL === "1";
const seriesSizes = runFullMatrix ? [10_000, 100_000, 500_000] : [10_000, 100_000];
const repeatedQueryCount = runFullMatrix ? 30 : 8;

for (const size of seriesSizes) {
  for (const scenario of [
    { metricCount: 3, pattern: "sorted" },
    { metricCount: 3, pattern: "reverse" },
    { metricCount: 3, pattern: "random" },
    { metricCount: 3, pattern: "duplicates" },
    { metricCount: 12, pattern: "sorted" },
  ]) {
    const points = createSeriesPoints(size, scenario);

    for (const backend of ["hybrid-js", "wasm-index"]) {
      const baseName = `chart.${formatSize(size)}.${scenario.pattern}.${scenario.metricCount}metrics.${backend}`;
      const beforeConstructMemory = readMemoryMb();
      let index;
      const construct = benchmark(`${baseName}.construct`, () => {
        index = createChartDensityIndex(points, { backend });
      });
      const afterConstructMemory = readMemoryMb();
      const queries = createSeriesQueries(size);

      results.push(construct);
      results.push({
        durationMs: Math.max(0, afterConstructMemory - beforeConstructMemory),
        kind: "memory",
        name: `${baseName}.memory.heapDelta`,
      });
      results.push(
        benchmark(`${baseName}.query.full`, () => {
          assertChartSeries(index.getChartSeries({ ...queries[0], valueMode: "average" }));
        }),
      );
      results.push(
        benchmark(`${baseName}.query.repeated`, () => {
          for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
            const valueMode = readValueMode(iteration);

            assertChartSeries(
              index.getChartSeries({
                ...queries[iteration % queries.length],
                valueMode,
              }),
            );
          }
        }),
      );
      results.push(
        benchmark(`${baseName}.summary.repeated`, () => {
          for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
            const series = index.getChartSeries({
              ...queries[2],
              valueMode: readValueMode(iteration),
            });

            assertViewportSummary(createChartDensityViewportSummary(series), series);
          }
        }),
      );
    }
  }
}

for (const size of seriesSizes) {
  const points = createSeriesPoints(size, { metricCount: 3, pattern: "sorted" });
  const baseName = `chart.${formatSize(size)}.sorted.3metrics.progressive`;
  let index;

  results.push(
    benchmark(`${baseName}.construct.hybrid-first`, () => {
      index = createProgressiveChartDensityIndex(points, {
        progressive: {
          warmup: "manual",
        },
      });
    }),
  );
  results.push(
    benchmark(`${baseName}.query.first-render`, () => {
      assertChartSeries(
        index.getChartSeries({
          targetBinCount: 250,
          valueMode: "average",
          xDomain: [0, size - 1],
        }),
      );
    }),
  );
  results.push(
    await benchmarkAsync(`${baseName}.warmup.wasm-index`, async () => {
      await index.warmWasmIndex();
    }),
  );
  results.push(
    benchmark(`${baseName}.query.after-warmup`, () => {
      assertChartSeries(
        index.getChartSeries({
          targetBinCount: 250,
          valueMode: "average",
          xDomain: [0, size - 1],
        }),
      );
    }),
  );
}

const maxDurationMs = 3_000;
const failNames = new Set([
  "chart.100k.sorted.3metrics.hybrid-js.construct",
  "chart.100k.sorted.3metrics.hybrid-js.query.full",
  "chart.100k.sorted.3metrics.wasm-index.construct",
  "chart.100k.sorted.3metrics.wasm-index.query.full",
  "chart.100k.sorted.3metrics.progressive.query.first-render",
  "chart.100k.sorted.3metrics.progressive.warmup.wasm-index",
  "chart.100k.sorted.3metrics.progressive.query.after-warmup",
]);
const slowBenchmarks = results.filter(
  (result) =>
    result.kind !== "memory" && failNames.has(result.name) && result.durationMs > maxDurationMs,
);

for (const result of results) {
  const suffix = result.kind === "memory" ? "MB heap delta" : "ms";
  console.log(`${result.name}: ${result.durationMs.toFixed(1)}${suffix}`);
}

if (!runFullMatrix) {
  console.log(
    "chart.full-matrix.skipped: set CHARTS_BENCH_FULL=1 to include 500k-point scenarios and 30-query loops",
  );
}

if (slowBenchmarks.length > 0) {
  console.error(
    `@moritzbrantner/charts stable benchmarks exceeded ${maxDurationMs}ms: ${slowBenchmarks
      .map((result) => result.name)
      .join(", ")}`,
  );
  process.exit(1);
}

function benchmark(name, run) {
  const startedAt = performance.now();

  run();

  return {
    durationMs: performance.now() - startedAt,
    name,
  };
}

async function benchmarkAsync(name, run) {
  const startedAt = performance.now();

  await run();

  return {
    durationMs: performance.now() - startedAt,
    name,
  };
}

function createSeriesPoints(size, scenario) {
  return Array.from({ length: size }, (_, index) => {
    const x = readScenarioX(index, size, scenario.pattern);

    return {
      id: `${scenario.pattern}-${scenario.metricCount}-${index}`,
      metrics: createMetrics(index, scenario.metricCount),
      properties: {
        group: index % 8,
      },
      x,
      y: Math.sin(index / 20) * 100 + (index % 11),
    };
  });
}

function createMetrics(index, metricCount) {
  return Object.fromEntries(
    Array.from({ length: metricCount }, (_, metricIndex) => [
      metricIndex === 0 ? "count" : `metric${metricIndex}`,
      metricIndex === 0 ? 1 : (index % (metricIndex + 7)) * (metricIndex + 1),
    ]),
  );
}

function readScenarioX(index, size, pattern) {
  switch (pattern) {
    case "duplicates":
      return Math.floor(index / 5);
    case "random":
      return (index * 48_271) % size;
    case "reverse":
      return size - index - 1;
    case "sorted":
      return index;
  }
}

function createSeriesQueries(size) {
  return [
    { targetBinCount: 250, xDomain: [0, size - 1] },
    { targetBinCount: 500, xDomain: [size * 0.25, size * 0.5] },
    {
      includeEmptyBins: true,
      targetBinCount: 1_000,
      xDomain: [size * 0.49, size * 0.51],
    },
  ];
}

function readValueMode(iteration) {
  return ["average", "count", "max", "min", "sum"][iteration % 5];
}

function assertChartSeries(series) {
  if (series.samples.length !== series.summary.sampleCount) {
    throw new Error("chart sample count did not match summary");
  }

  if (series.bins.length !== series.summary.binCount) {
    throw new Error("chart bin count did not match summary");
  }

  if (series.summary.metrics.count !== series.summary.pointCount) {
    throw new Error("chart count metric did not match point count");
  }
}

function assertViewportSummary(summary, series) {
  if (summary.sampleCount !== series.summary.sampleCount) {
    throw new Error("chart viewport sample count did not match series");
  }

  if (summary.itemCount !== series.summary.pointCount) {
    throw new Error("chart viewport item count did not match point count");
  }
}

function formatSize(size) {
  if (size >= 1_000) {
    return `${Math.round(size / 1_000)}k`;
  }

  return String(size);
}

function readMemoryMb() {
  return typeof process.memoryUsage === "function" ? process.memoryUsage().heapUsed / 1_048_576 : 0;
}
