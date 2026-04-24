import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Keyboard, KeyboardKey, KeyboardRow } from "../../src";

describe("@moritzbrantner/ui keyboard", () => {
  test("renders a data-driven keyboard layout with stateful keys", () => {
    const { container } = render(
      <Keyboard
        aria-label="Editor keyboard"
        rows={[
          {
            keys: [
              { label: "Esc", tone: "muted" },
              { label: "1", hint: "!" },
              { label: "Delete", span: 2, align: "end", pressed: true, tone: "accent" },
            ],
          },
          {
            keys: [
              { label: "Ctrl", disabled: true, tone: "muted" },
              { label: "Space", span: 4.5 },
            ],
          },
        ]}
      />,
    );

    expect(container.querySelector("[data-slot='keyboard']")).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='keyboard-row']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-slot='keyboard-key']")).toHaveLength(5);
    expect(screen.getByText("Delete").closest("[data-slot='keyboard-key']")?.getAttribute("data-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("Ctrl").closest("[data-slot='keyboard-key']")?.getAttribute("data-disabled")).toBe(
      "true",
    );
    expect(screen.getByText("Space").closest("[data-slot='keyboard-key']")?.getAttribute("style")).toContain(
      "--keyboard-key-span: 4.5",
    );
    expect(screen.getByText("!")).toBeTruthy();
  });

  test("supports manual composition with rows and keys", () => {
    const { container } = render(
      <Keyboard size="sm">
        <KeyboardRow>
          <KeyboardKey hint="!" tone="accent">
            1
          </KeyboardKey>
          <KeyboardKey span={2} align="start">
            Tab
          </KeyboardKey>
        </KeyboardRow>
      </Keyboard>,
    );

    expect(container.querySelector("[data-slot='keyboard']")?.getAttribute("data-size")).toBe("sm");
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Tab")).toBeTruthy();
  });
});
