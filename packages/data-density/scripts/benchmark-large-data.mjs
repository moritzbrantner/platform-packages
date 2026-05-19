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

const benchmarks = [
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
  benchmark("series.100k.bin", () => {
    const points = Array.from({ length: 100_000 }, (_, index) => ({
      id: index,
      metrics: { count: 1, weighted: index },
      x: index,
      y: Math.sin(index / 20) * 100,
    }));
    const index = createBinnedSeriesIndex(points);

    index.getBinnedSeries({ targetBinCount: 500, xDomain: [0, 99_999] });
  }),
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
];

const maxDurationMs = 2_500;
const slowBenchmarks = benchmarks.filter((result) => result.durationMs > maxDurationMs);

for (const result of benchmarks) {
  console.log(`${result.name}: ${result.durationMs.toFixed(1)}ms`);
}

if (slowBenchmarks.length > 0) {
  console.error(
    `@moritzbrantner/data-density benchmarks exceeded ${maxDurationMs}ms: ${slowBenchmarks
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
