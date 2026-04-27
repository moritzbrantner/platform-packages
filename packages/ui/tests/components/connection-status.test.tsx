import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ConnectionStatus } from "../../src";

describe("connection status", () => {
  test("renders connected, disconnected, and out-of-sync states", () => {
    render(
      <div>
        <ConnectionStatus status="connected" onSync={() => undefined} />
        <ConnectionStatus status="disconnected" onReconnect={() => undefined} />
        <ConnectionStatus status="out-of-sync" onSync={() => undefined} />
      </div>,
    );

    expect(screen.getByText("Connected").closest("button")).toBeTruthy();
    expect(screen.getByText("Disconnected").closest("button")).toBeTruthy();
    expect(screen.getByText("Out of sync").closest("button")).toBeTruthy();
    expect(screen.getByText("Sync now")).toBeTruthy();
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

  test("clicking connected and out-of-sync states routes to sync", async () => {
    const onSync = vi.fn();

    render(
      <div>
        <ConnectionStatus status="connected" onSync={onSync} />
        <ConnectionStatus status="out-of-sync" onSync={onSync} />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Connected/i }));
    fireEvent.click(screen.getByRole("button", { name: /Out of sync/i }));

    await waitFor(() => {
      expect(onSync).toHaveBeenCalledTimes(2);
    });
  });

  test("disables the control when no reconnect or sync handler is available", () => {
    render(<ConnectionStatus status="out-of-sync" />);

    expect(screen.getByText("Out of sync").closest("button")?.getAttribute("disabled")).toBe("");
  });
});
