import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ConnectionStatus } from "..";

describe("connection status", () => {
  test("renders connected, synced, disconnected, and out-of-sync states", () => {
    render(
      <div>
        <ConnectionStatus status="connected" onSync={() => undefined} />
        <ConnectionStatus status="synced" onSync={() => undefined} />
        <ConnectionStatus status="disconnected" onReconnect={() => undefined} />
        <ConnectionStatus status="out-of-sync" onSync={() => undefined} />
      </div>,
    );

    expect(screen.getByText("Connected").closest("button")).toBeTruthy();
    expect(screen.getByText("Connected and synced").closest("button")).toBeTruthy();
    expect(screen.getByText("Disconnected").closest("button")).toBeTruthy();
    expect(screen.getByText("Out of sync").closest("button")).toBeTruthy();
    expect(screen.getByText("Sync now")).toBeTruthy();
    expect(screen.getByText("Synced up")).toBeTruthy();
    expect(screen.getByText("Reconnect")).toBeTruthy();
    expect(screen.getByText("Sync up")).toBeTruthy();
  });

  test("clicking a disconnected status tries to reconnect and shows pending feedback", async () => {
    let resolveReconnect: (() => void) | undefined;
    const onReconnect = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveReconnect = resolve;
        }),
    );

    render(<ConnectionStatus status="disconnected" onReconnect={onReconnect} />);

    fireEvent.click(screen.getByRole("button", { name: /Disconnected/i }));

    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Reconnecting...")).toBeTruthy();

    resolveReconnect?.();

    await waitFor(() => {
      expect(screen.queryByText("Reconnecting...")).toBeNull();
    });
  });

  test("clicking connected, synced, and out-of-sync states routes to sync", async () => {
    const onSync = vi.fn();

    render(
      <div>
        <ConnectionStatus status="connected" onSync={onSync} />
        <ConnectionStatus status="synced" onSync={onSync} />
        <ConnectionStatus status="out-of-sync" onSync={onSync} />
      </div>,
    );

    fireEvent.click(screen.getByText("Connected").closest("button")!);
    fireEvent.click(screen.getByText("Connected and synced").closest("button")!);
    fireEvent.click(screen.getByText("Out of sync").closest("button")!);

    await waitFor(() => {
      expect(onSync).toHaveBeenCalledTimes(3);
    });
  });

  test("renders action labels with hover and active light-up states", () => {
    render(<ConnectionStatus status="synced" onSync={() => undefined} />);

    const action = screen.getByText("Synced up");

    expect(action.className).toContain("group-hover/connection-status:bg-emerald-500/22");
    expect(action.className).toContain("group-active/connection-status:bg-emerald-500/30");
  });

  test("disables the control when no reconnect or sync handler is available", () => {
    render(<ConnectionStatus status="out-of-sync" />);

    expect(screen.getByText("Out of sync").closest("button")?.getAttribute("disabled")).toBe("");
  });
});
