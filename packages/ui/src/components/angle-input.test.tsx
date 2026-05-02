import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import { AngleInput } from "..";

describe("AngleInput", () => {
  test("updates with keyboard controls and wraps values within 360 degrees", () => {
    const handleValueChange = vi.fn();

    render(
      <AngleInput
        defaultValue={359}
        onValueChange={handleValueChange}
        dialAriaLabel="Rotation angle"
        inputAriaLabel="Rotation degrees"
      />,
    );

    const dial = screen.getByRole("slider", { name: "Rotation angle" });

    fireEvent.keyDown(dial, { key: "ArrowRight" });
    expect(dial.getAttribute("aria-valuenow")).toBe("0");
    expect(handleValueChange).toHaveBeenLastCalledWith(0);

    fireEvent.keyDown(dial, { key: "ArrowLeft" });
    expect(dial.getAttribute("aria-valuenow")).toBe("359");
    expect(handleValueChange).toHaveBeenLastCalledWith(359);

    fireEvent.keyDown(dial, { key: "PageUp" });
    expect(dial.getAttribute("aria-valuenow")).toBe("44");
    expect(handleValueChange).toHaveBeenLastCalledWith(44);

    fireEvent.keyDown(dial, { key: "Home" });
    expect(dial.getAttribute("aria-valuenow")).toBe("0");

    fireEvent.keyDown(dial, { key: "End" });
    expect(dial.getAttribute("aria-valuenow")).toBe("359");
  });

  test("rotates through the quick action buttons", () => {
    render(
      <AngleInput
        defaultValue={315}
        dialAriaLabel="Rotation angle"
        inputAriaLabel="Rotation degrees"
      />,
    );

    const dial = screen.getByRole("slider", { name: "Rotation angle" });

    fireEvent.click(screen.getByRole("button", { name: "Increase angle by 45 degrees" }));
    expect(dial.getAttribute("aria-valuenow")).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Decrease angle by 45 degrees" }));
    expect(dial.getAttribute("aria-valuenow")).toBe("315");
  });

  test("supports controlled updates and normalizes typed values", () => {
    function ControlledDemo() {
      const [value, setValue] = React.useState(15);

      return (
        <AngleInput
          value={value}
          onValueChange={setValue}
          dialAriaLabel="Rotation angle"
          inputAriaLabel="Rotation degrees"
          name="rotation"
        />
      );
    }

    render(<ControlledDemo />);

    const dial = screen.getByRole("slider", { name: "Rotation angle" });
    const input = screen.getByRole("spinbutton", { name: "Rotation degrees" });
    const hiddenInput = document.querySelector(
      'input[type="hidden"][name="rotation"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "450" } });
    fireEvent.blur(input);

    expect(dial.getAttribute("aria-valuenow")).toBe("90");
    expect(hiddenInput.value).toBe("90");

    fireEvent.click(screen.getByRole("button", { name: "Reset angle" }));
    expect(dial.getAttribute("aria-valuenow")).toBe("0");
    expect(hiddenInput.value).toBe("0");
  });
});
