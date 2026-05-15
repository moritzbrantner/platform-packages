import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ShortcutHelpDialog, ShortcutList, type ShortcutHelpGroup } from "..";

const groups = [
  {
    id: "global",
    label: "Global",
    shortcuts: [{ id: "palette", label: "Open palette", shortcut: "Meta+K" }],
  },
] satisfies ShortcutHelpGroup[];

describe("shortcut help", () => {
  test("renders groups and shortcut keys", () => {
    render(<ShortcutList groups={groups} />);

    expect(screen.getByText("Global")).toBeTruthy();
    expect(screen.getByText("Open palette")).toBeTruthy();
    expect(screen.getByText("Meta")).toBeTruthy();
    expect(screen.getByText("K")).toBeTruthy();
  });

  test("renders accessible dialog copy", () => {
    render(<ShortcutHelpDialog open groups={groups} title="Shortcuts" description="Use these keys." />);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Shortcuts")).toBeTruthy();
    expect(screen.getByText("Use these keys.")).toBeTruthy();
  });
});
