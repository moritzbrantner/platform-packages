import { describe, expect, test, vi } from "vitest";

import {
  createKeyboardShortcutRegistry,
  formatKeyboardShortcut,
  isEditableKeyboardTarget,
  matchesKeyboardShortcut,
  normalizeKeyboardShortcut,
  parseKeyboardShortcut,
} from "@moritzbrantner/keyboard";

describe("@moritzbrantner/keyboard", () => {
  test("parses and formats platform-aware shortcuts", () => {
    expect(parseKeyboardShortcut("mod+shift+k")).toEqual({
      key: "k",
      modifiers: ["mod", "shift"],
    });
    expect(normalizeKeyboardShortcut("mod+k", "mac")).toEqual({
      allowInEditable: false,
      key: "k",
      modifiers: ["meta"],
    });
    expect(normalizeKeyboardShortcut("mod+k", "windows")).toEqual({
      allowInEditable: false,
      key: "k",
      modifiers: ["ctrl"],
    });
    expect(formatKeyboardShortcut("mod+shift+k", "mac")).toBe("ShiftCommandK");
    expect(formatKeyboardShortcut("mod+shift+k", "windows")).toBe("Ctrl+Shift+K");
  });

  test("matches shortcuts and ignores editable targets by default", () => {
    const input = document.createElement("input");

    expect(
      matchesKeyboardShortcut(
        { key: "k", metaKey: true, target: document.body },
        "mod+k",
        "mac",
      ),
    ).toBe(true);
    expect(
      matchesKeyboardShortcut({ key: "k", metaKey: true, target: input }, "mod+k", "mac"),
    ).toBe(false);
    expect(
      matchesKeyboardShortcut(
        { key: "k", metaKey: true, target: input },
        { allowInEditable: true, key: "k", modifiers: ["mod"] },
        "mac",
      ),
    ).toBe(true);
    expect(isEditableKeyboardTarget(input)).toBe(true);
  });

  test("registers scoped commands by priority and prevents default", () => {
    const registry = createKeyboardShortcutRegistry({ platform: "windows" });
    const first = vi.fn();
    const second = vi.fn();
    const preventDefault = vi.fn();

    registry.register({
      handler: first,
      id: "first",
      priority: 1,
      shortcut: "ctrl+k",
    });
    registry.register({
      handler: second,
      id: "second",
      priority: 2,
      scope: "details",
      shortcut: "ctrl+k",
    });

    expect(
      registry.handleEvent({
        ctrlKey: true,
        key: "k",
        preventDefault,
        target: document.body,
      }),
    ).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalledTimes(1);

    registry.setScope("details");

    expect(
      registry.handleEvent({
        ctrlKey: true,
        key: "k",
        preventDefault,
        target: document.body,
      }),
    ).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);

    registry.unregister("second");
    expect(registry.getCommands().map((command) => command.id)).toEqual(["first"]);
  });
});
