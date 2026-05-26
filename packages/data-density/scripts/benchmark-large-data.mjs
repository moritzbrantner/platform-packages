import { existsSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(packageRoot, "dist", "index.js");

if (!existsSync(distEntry)) {
  console.error(
    "@moritzbrantner/data-density benchmark requires dist/. Run `bun run build` first.",
  );
  process.exit(1);
}

const { createBinnedSeriesIndex, createDataDensityWindowIndex, createGeoPointAggregationIndex } =
  await import(distEntry);

const results = [];
const runFullMatrix = process.env.DATA_DENSITY_BENCH_FULL === "1";
const seriesSizes = runFullMatrix ? [10_000, 100_000, 500_000] : [10_000, 100_000];
const repeatedQueryCount = runFullMatrix ? 30 : 8;

results.push(
  benchmark("window.100k.query", () => {
    const rows = Array.from({ length: 100_000 }, (_, index) => ({
      id: `row-${index}`,
      metrics: { value: index % 100 },
      status: index % 3 === 0 ? "active" : "archived",
    }));
    const index = createDataDensityWindowIndex(rows, {
      filterItem(row) {
        return row.status === "active";
      },
    });

    for (let offset = 0; offset < 10_000; offset += 250) {
      index.getWindow({ limit: 80, offset, overscan: 20 });
    }
  }),
);

results.push(
  benchmark("geo.25k.cluster", () => {
    const points = Array.from({ length: 25_000 }, (_, index) => ({
      id: `point-${index}`,
      latitude: -60 + (index % 120),
      longitude: -170 + ((index * 17) % 340),
      metrics: { count: 1 },
    }));
    const index = createGeoPointAggregationIndex(points);

    index.getViewportAggregation({ bounds: [-180, -85, 180, 85], zoom: 4 });
  }),
);

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
      const baseName = `series.${formatSize(size)}.${scenario.pattern}.${scenario.metricCount}metrics.${backend}`;
      const beforeConstructMemory = readMemoryMb();
      let index;
      const construct = benchmark(`${baseName}.construct`, () => {
        index = createBinnedSeriesIndex(points, { backend });
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
          index.getBinnedSeries(queries[0]);
        }),
      );
      results.push(
        benchmark(`${baseName}.query.repeated`, () => {
          for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
            index.getBinnedSeries(queries[iteration % queries.length]);
          }
        }),
      );
      results.push(
        benchmark(`${baseName}.query.zoomed`, () => {
          for (let iteration = 0; iteration < repeatedQueryCount; iteration += 1) {
            index.getBinnedSeries(queries[2]);
          }
        }),
      );
    }
  }
}

const maxDurationMs = 2_500;
const failNames = new Set([
  "window.100k.query",
  "geo.25k.cluster",
  "series.100k.sorted.3metrics.hybrid-js.construct",
  "series.100k.sorted.3metrics.hybrid-js.query.full",
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
    "series.full-matrix.skipped: set DATA_DENSITY_BENCH_FULL=1 to include 500k-point scenarios and 30-query loops",
  );
}

if (slowBenchmarks.length > 0) {
  console.error(
    `@moritzbrantner/data-density stable benchmarks exceeded ${maxDurationMs}ms: ${slowBenchmarks
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

function createSeriesPoints(size, scenario) {
  return Array.from({ length: size }, (_, index) => {
    const x = readScenarioX(index, size, scenario.pattern);

    return {
      id: `${scenario.pattern}-${scenario.metricCount}-${index}`,
      metrics: createMetrics(index, scenario.metricCount),
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

function formatSize(size) {
  if (size >= 1_000) {
    return `${Math.round(size / 1_000)}k`;
  }

  return String(size);
}

function readMemoryMb() {
  return typeof process.memoryUsage === "function" ? process.memoryUsage().heapUsed / 1_048_576 : 0;
}
