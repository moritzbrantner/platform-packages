import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test } from "vitest";

import { WorkbenchLayout } from "..";

beforeAll(() => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("workbench layout", () => {
  test("renders toolbar, canvas, and optional panels", () => {
    render(
      <WorkbenchLayout
        toolbar={<button type="button">Run</button>}
        leftPanel={<div>Assets</div>}
        rightPanel={<div>Inspector</div>}
        bottomPanel={<div>Console</div>}
      >
        Canvas
      </WorkbenchLayout>,
    );

    expect(screen.getByText("Run")).toBeTruthy();
    expect(screen.getAllByText("Canvas")[0]).toBeTruthy();
    expect(screen.getAllByText("Assets")[0]).toBeTruthy();
    expect(screen.getAllByText("Inspector")[0]).toBeTruthy();
    expect(screen.getAllByText("Console")[0]).toBeTruthy();
  });

  test("omits missing panels cleanly and exposes data slots", () => {
    render(<WorkbenchLayout data-testid="workbench">Canvas only</WorkbenchLayout>);

    expect(screen.getByTestId("workbench").getAttribute("data-slot")).toBe("workbench-layout");
    expect(screen.getAllByText("Canvas only")[0]).toBeTruthy();
  });
});
