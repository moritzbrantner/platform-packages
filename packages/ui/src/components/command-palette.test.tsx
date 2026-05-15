import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import { CommandPalette, type CommandPaletteGroup } from "..";

beforeAll(() => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLElement.prototype.scrollIntoView ??= vi.fn();
});

const groups = [
  {
    id: "actions",
    label: "Actions",
    actions: [
      {
        id: "open",
        label: "Open package",
        description: "Open package details.",
      },
      {
        id: "disabled",
        label: "Disabled action",
        disabled: true,
      },
    ],
  },
] satisfies CommandPaletteGroup[];

describe("command palette", () => {
  test("renders groups and actions", () => {
    render(<CommandPalette open groups={groups} />);

    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Open package")).toBeTruthy();
    expect(screen.getByText("Open package details.")).toBeTruthy();
  });

  test("selects enabled actions and closes the dialog", () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        groups={[
          {
            id: "actions",
            actions: [{ id: "open", label: "Open package", onSelect }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText("Open package"));

    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("does not select disabled actions", () => {
    const onSelect = vi.fn();

    render(
      <CommandPalette
        open
        groups={[
          {
            id: "actions",
            actions: [{ id: "disabled", label: "Disabled action", disabled: true, onSelect }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText("Disabled action"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  test("renders loading state", () => {
    render(<CommandPalette open loading groups={[]} loadingMessage="Loading commands" />);

    expect(screen.getByRole("status").textContent).toContain("Loading commands");
  });
});
