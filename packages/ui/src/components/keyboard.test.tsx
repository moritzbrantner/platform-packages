import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Keyboard, KeyboardKey, KeyboardRow } from "..";

describe("@moritzbrantner/ui keyboard", () => {
  test("renders a data-driven keyboard layout with stateful and interactive keys", () => {
    const oneClick = vi.fn();
    const slashClick = vi.fn();
    const deleteClick = vi.fn();
    const { container } = render(
      <Keyboard
        aria-label="Editor keyboard"
        rows={[
          {
            keys: [
              { label: "Esc", tone: "muted" },
              { label: "1", hint: "!", onClick: oneClick },
              {
                label: "Delete",
                span: 2,
                align: "end",
                pressed: true,
                tone: "accent",
                onClick: deleteClick,
              },
            ],
          },
          {
            keys: [
              { label: "Ctrl", tone: "muted" },
              { label: "/", hint: "?", onClick: slashClick },
              { label: "Space", span: 4.5 },
            ],
          },
        ]}
      />,
    );
    const oneKey = screen.getByText("1").closest("[data-slot='keyboard-key']");
    const ctrlKey = screen.getByText("Ctrl").closest("[data-slot='keyboard-key']");
    const slashKey = screen.getByText("/").closest("[data-slot='keyboard-key']");
    const spaceKey = screen.getByText("Space").closest("[data-slot='keyboard-key']");

    expect(container.querySelector("[data-slot='keyboard']")).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='keyboard-row']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-slot='keyboard-key']")).toHaveLength(6);
    expect(oneKey?.tagName).toBe("BUTTON");
    expect(
      screen
        .getByText("Delete")
        .closest("[data-slot='keyboard-key']")
        ?.getAttribute("data-pressed"),
    ).toBe("true");
    expect(ctrlKey?.getAttribute("aria-keyshortcuts")).toBe("Ctrl");
    expect(spaceKey?.getAttribute("style")).toContain("--keyboard-key-span: 4.5");
    expect(screen.getByText("!")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Control", ctrlKey: true });
    expect(ctrlKey?.getAttribute("data-pressed")).toBe("true");

    fireEvent.keyDown(window, { key: "1", ctrlKey: true });
    expect(oneKey?.getAttribute("data-pressed")).toBe("true");
    expect(oneClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "?", ctrlKey: true, shiftKey: true });
    expect(slashKey?.getAttribute("data-pressed")).toBe("true");
    expect(slashClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Backspace", ctrlKey: true });
    expect(deleteClick).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(window, { key: "Backspace", ctrlKey: true });
    fireEvent.keyUp(window, { key: "?", ctrlKey: true, shiftKey: false });
    fireEvent.keyUp(window, { key: "1", ctrlKey: true });
    fireEvent.keyUp(window, { key: "Control", ctrlKey: false });
    expect(ctrlKey?.getAttribute("data-pressed")).toBeNull();
    expect(oneKey?.getAttribute("data-pressed")).toBeNull();
    expect(slashKey?.getAttribute("data-pressed")).toBeNull();
  });

  test("supports manual composition with explicit combo hotkeys", () => {
    const commandClick = vi.fn();
    const { container } = render(
      <Keyboard size="sm">
        <KeyboardRow>
          <KeyboardKey hint="!" tone="accent">
            1
          </KeyboardKey>
          <KeyboardKey hotkey="ctrl+k" onClick={commandClick} span={2} align="start">
            Command Palette
          </KeyboardKey>
        </KeyboardRow>
      </Keyboard>,
    );
    const commandKey = screen.getByText("Command Palette").closest("[data-slot='keyboard-key']");

    expect(container.querySelector("[data-slot='keyboard']")?.getAttribute("data-size")).toBe("sm");
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Command Palette")).toBeTruthy();
    expect(commandKey?.getAttribute("aria-keyshortcuts")).toBe("Ctrl+K");

    fireEvent.keyDown(window, { key: "Control", ctrlKey: true });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(commandKey?.getAttribute("data-pressed")).toBe("true");
    expect(commandClick).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(window, { key: "Control", ctrlKey: false });
    expect(commandKey?.getAttribute("data-pressed")).toBeNull();

    fireEvent.keyUp(window, { key: "k", ctrlKey: false });
  });
});
