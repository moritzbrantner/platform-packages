import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
  StateViewActions,
  StateViewDescription,
  StateViewTitle,
} from "..";

describe("state view", () => {
  test("renders status and alert roles for semantic states", () => {
    render(
      <div>
        <LoadingState label="Loading files" />
        <ErrorState />
        <OfflineState />
      </div>,
    );

    expect(screen.getByRole("status").textContent).toContain("Loading files");
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  test("supports custom content and forwarded props", () => {
    render(
      <EmptyState className="custom-state" data-testid="state">
        <StateViewTitle>No assets</StateViewTitle>
        <StateViewDescription>Add files to continue.</StateViewDescription>
        <StateViewActions>
          <button type="button">Upload</button>
        </StateViewActions>
      </EmptyState>,
    );

    expect(screen.getByTestId("state").className).toContain("custom-state");
    expect(screen.getByText("No assets")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload" })).toBeTruthy();
  });
});
