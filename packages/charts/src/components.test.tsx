import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  ChartBackendStatus,
  ChartRangeSelector,
  ChartSampleSparkline,
  ChartValueModeSelector,
  createChartDensityIndex,
  getChartValueModeDefinitions,
  getChartSampleYBounds,
  measureChartSeries,
  useChartBinCount,
} from "@moritzbrantner/charts";

describe("@moritzbrantner/charts", () => {
  test("renders default value modes and selects a mode", () => {
    const onValueChange = vi.fn();

    render(<ChartValueModeSelector value="average" onValueChange={onValueChange} />);

    for (const mode of ["Average", "Count", "Maximum", "Minimum", "Sum"]) {
      expect(screen.getByRole("radio", { name: mode })).toBeTruthy();
    }

    expect(screen.getByRole("radio", { name: "Average" }).getAttribute("aria-checked")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("radio", { name: "Count" }));

    expect(onValueChange).toHaveBeenCalledWith("count");
  });

  test("renders selected value mode definitions", () => {
    render(
      <ChartValueModeSelector
        value="min"
        definitions={getChartValueModeDefinitions(["min", "max"])}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Minimum" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Average" })).toBeNull();
  });

  test("renders chart ranges and selects a range", () => {
    const onValueChange = vi.fn();

    render(
      <ChartRangeSelector
        value="day"
        formatDomain={(domain) => `${domain[0]} to ${domain[1]}`}
        onValueChange={onValueChange}
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

    expect(screen.getByRole("radiogroup", { name: "Chart range" })).toBeTruthy();
    expect(screen.getByText("Day")).toBeTruthy();
    expect(screen.getByText("0 to 24")).toBeTruthy();
    expect(screen.getByText("Focused source domain.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Day/ }).getAttribute("aria-checked")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: /Focus/ }));

    expect(onValueChange).toHaveBeenCalledWith("focus");
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
        onWarmNow={onWarmNow}
        status={{
          activeBackend: "hybrid-js",
          isWarming: true,
          wasmError: null,
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("warming")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Warm WASM now" }).hasAttribute("disabled")).toBe(
      true,
    );

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

  test("renders backend fallback status and formats errors", () => {
    render(
      <ChartBackendStatus
        formatError={(error) => `Fallback reason: ${String(error)}`}
        status={{
          activeBackend: "hybrid-js",
          isWarming: false,
          wasmError: "load failed",
          wasmReady: false,
        }}
      />,
    );

    expect(screen.getByText("fallback")).toBeTruthy();
    expect(screen.getByText("Fallback reason: load failed")).toBeTruthy();
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

  test("selects and hovers sparkline samples", () => {
    const onSampleHover = vi.fn();
    const onSampleSelect = vi.fn();
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
    const { container } = render(
      <ChartSampleSparkline
        samples={series.samples}
        domain={[0, 10]}
        selectedSampleIndex={series.samples[0]?.index}
        onSampleHover={onSampleHover}
        onSampleSelect={onSampleSelect}
      />,
    );
    const svg = screen.getByRole("img", {
      name: "Dense chart sparkline",
    }) as unknown as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.pointerMove(svg, { clientX: 0 });
    fireEvent.click(svg, { clientX: 0 });
    fireEvent.pointerLeave(svg);

    expect(onSampleHover).toHaveBeenCalledWith(series.samples[0]);
    expect(onSampleHover).toHaveBeenLastCalledWith(null);
    expect(onSampleSelect).toHaveBeenCalledWith(series.samples[0]);
    expect(container.querySelector("circle")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sample 1/ }));

    expect(onSampleSelect).toHaveBeenCalledTimes(2);
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

  test("measures responsive chart bin counts and manual overrides", () => {
    let resizeCallback: ResizeObserverCallback | null = null;

    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe = vi.fn();
        disconnect = vi.fn();
      },
    );

    const element = document.createElement("div");
    const { result } = renderHook(() => useChartBinCount());

    act(() => {
      result.current.containerRef(element);
    });
    act(() => {
      resizeCallback?.(
        [
          {
            contentRect: { width: 960 },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(result.current.targetBinCount).toBe(120);
    expect(result.current.isAuto).toBe(true);

    act(() => {
      result.current.setManualBinCount(999);
    });

    expect(result.current.targetBinCount).toBe(360);
    expect(result.current.isAuto).toBe(false);

    act(() => {
      result.current.resetAuto();
    });

    expect(result.current.targetBinCount).toBe(120);
    expect(result.current.isAuto).toBe(true);
  });
});
