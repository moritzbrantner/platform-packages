import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FieldGrid, FieldLegend, Fieldset, ValidationSummary } from "..";

describe("form layout", () => {
  test("renders semantic fieldset and legend", () => {
    render(
      <Fieldset>
        <FieldLegend>Settings</FieldLegend>
      </Fieldset>,
    );

    expect(screen.getByRole("group", { name: "Settings" })).toBeTruthy();
  });

  test("validation summary only renders when content exists", () => {
    const { rerender } = render(<ValidationSummary errors={[]} />);

    expect(screen.queryByRole("alert")).toBeNull();

    rerender(<ValidationSummary errors={["Name is required"]} />);

    expect(screen.getByRole("alert").textContent).toContain("Name is required");
  });

  test("field grid exposes column data attributes", () => {
    render(<FieldGrid columns="three" data-testid="grid" />);

    expect(screen.getByTestId("grid").getAttribute("data-columns")).toBe("three");
  });
});
