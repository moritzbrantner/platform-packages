import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StoryContainer, StoryScene, StorySeries } from "../src";

describe("@moritzbrantner/storytelling", () => {
  test("renders a story container in jsdom", () => {
    render(
      <StoryContainer title="History" subtitle="Timeline">
        <StorySeries ariaLabel="Story">
          <StoryScene id="one" title="One">
            First scene
          </StoryScene>
          <StoryScene id="two" title="Two">
            Second scene
          </StoryScene>
        </StorySeries>
      </StoryContainer>,
    );

    expect(screen.getByRole("region", { name: "History" })).toBeTruthy();
    expect(screen.getByText("First scene")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });
});
