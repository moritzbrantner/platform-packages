import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SelectionToolbar } from "..";

describe("selection toolbar", () => {
  test("does not render when nothing is selected", () => {
    const { container } = render(<SelectionToolbar selectedCount={0} />);

    expect(container.textContent).toBe("");
  });

  test("renders count labels and clear action", () => {
    const onClearSelection = vi.fn();

    render(
      <SelectionToolbar selectedCount={2} totalCount={9} onClearSelection={onClearSelection} />,
    );

    expect(screen.getByText("2 of 9 selected")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(onClearSelection).toHaveBeenCalled();
  });
});
