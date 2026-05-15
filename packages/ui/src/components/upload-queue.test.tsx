import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { UploadQueue, type UploadQueueFile } from "..";

const items = [
  { id: "queued", name: "queued.txt", status: "queued" },
  { id: "uploading", name: "uploading.txt", status: "uploading", progress: 50 },
  { id: "complete", name: "complete.txt", status: "complete" },
  { id: "error", name: "error.txt", status: "error", error: "Failed" },
  { id: "canceled", name: "canceled.txt", status: "canceled" },
] satisfies UploadQueueFile[];

describe("upload queue", () => {
  test("renders all item statuses", () => {
    render(<UploadQueue items={items} />);

    expect(screen.getByText("Queued")).toBeTruthy();
    expect(screen.getByText("Uploading")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    expect(screen.getByText("Error")).toBeTruthy();
    expect(screen.getByText("Canceled")).toBeTruthy();
  });

  test("calls retry, cancel, and remove callbacks with the item", () => {
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    const onRemove = vi.fn();

    render(
      <UploadQueue items={items} onRetry={onRetry} onCancel={onCancel} onRemove={onRemove} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Remove upload" })[0]);

    expect(onRetry).toHaveBeenCalledWith(items[3]);
    expect(onCancel).toHaveBeenCalledWith(items[1]);
    expect(onRemove).toHaveBeenCalledWith(items[0]);
  });

  test("renders empty state", () => {
    render(<UploadQueue items={[]} emptyState="Nothing queued" />);

    expect(screen.getByText("Nothing queued")).toBeTruthy();
  });
});
