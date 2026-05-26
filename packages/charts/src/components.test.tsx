import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  ChartBackendStatus,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartValueModeSelector,
  createChartDensityIndex,
  getChartSampleYBounds,
  measureChartSeries,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  test("renders default value modes and selects a mode", () => {
    const onValueModeChange = vi.fn();

    render(<ChartValueModeSelector valueMode="average" onValueModeChange={onValueModeChange} />);

    for (const mode of ["average", "count", "max", "min", "sum"]) {
      expect(screen.getByRole("button", { name: mode })).toBeTruthy();
    }

    expect(screen.getByRole("button", { name: "average" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "count" }));

    expect(onValueModeChange).toHaveBeenCalledWith("count");
  });

  test("renders chart ranges and selects a range", () => {
    const onRangeChange = vi.fn();

    render(
      <ChartRangeSelector
        activeRangeId="day"
        formatDomain={(domain) => `${domain[0]} to ${domain[1]}`}
        onRangeChange={onRangeChange}
        ranges={[
          {
            description: "Full source domain.",
            domain: [0, 24],
            id: "day",
            label: "Day",
          },
          {
            description: "Focused source domain.",
            domain: [8, 12],
            id: "focus",
            label: "Focus",
          },
        ]}
      />,
    );

    expect(screen.getByText("Day")).toBeTruthy();
    expect(screen.getByText("0 to 24")).toBeTruthy();
    expect(screen.getByText("Focused source domain.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Focus/ }));

    expect(onRangeChange).toHaveBeenCalledWith("focus");
  });

  test("renders backend status states and handles warmup", () => {
    const onWarmNow = vi.fn();
    const { rerender } = render(
      <ChartBackendStatus
        onWarmNow={onWarmNow}
        status={{
          activeBackend: "hybrid-js",
          isWarming: false,
          wasmError: null,
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("hybrid-js")).toBeTruthy();
    expect(screen.getByText("scheduled")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Warm WASM now" }));

    expect(onWarmNow).toHaveBeenCalledTimes(1);

    rerender(
      <ChartBackendStatus
        status={{
          activeBackend: "hybrid-js",
          isWarming: true,
          wasmError: null,
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("warming")).toBeTruthy();

    rerender(
      <ChartBackendStatus
        status={{
          activeBackend: "wasm-index",
          isWarming: false,
          wasmError: null,
          wasmReady: true,
        }}
      />,
    );

    expect(screen.getByText("wasm-index")).toBeTruthy();
    expect(screen.getByText("ready")).toBeTruthy();
  });

  test("renders sparkline samples and clamps SVG points", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 5, y: 12 },
      { id: "c", x: 10, y: 4 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 3,
      xDomain: [0, 10],
    });
    const { container } = render(<ChartSampleSparkline samples={series.samples} domain={[2, 8]} />);

    expect(screen.getByRole("img", { name: "Dense chart sparkline" })).toBeTruthy();

    const line = container.querySelector("polyline[stroke='var(--primary)']");
    const points = line?.getAttribute("points") ?? "";

    for (const pair of points.split(" ")) {
      const [x, y] = pair.split(",").map(Number);

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(92);
    }
  });

  test("renders sparkline empty state for empty samples", () => {
    render(<ChartSampleSparkline samples={[]} domain={[0, 1]} />);

    expect(screen.getByText("No chart samples in this viewport.")).toBeTruthy();
  });

  test("measures chart queries", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: 2 },
      { id: "b", x: 1, y: 4 },
    ]);
    const measured = measureChartSeries(index, {
      targetBinCount: 1,
      xDomain: [0, 1],
    });

    expect(measured.series.summary.pointCount).toBe(2);
    expect(measured.queryMs).toBeGreaterThanOrEqual(0);
  });

  test("gets visible sample y bounds", () => {
    const index = createChartDensityIndex([
      { id: "a", x: 0, y: -2 },
      { id: "b", x: 1, y: 8 },
    ]);
    const series = index.getChartSeries({
      includeEmptyBins: true,
      targetBinCount: 2,
      xDomain: [0, 2],
    });

    expect(getChartSampleYBounds(series.samples)).toEqual({
      maxY: 8,
      minY: -2,
    });
    expect(getChartSampleYBounds([])).toEqual({
      maxY: null,
      minY: null,
    });
  });
});
