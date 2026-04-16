import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  InteractiveStoryPlayer,
  StoryContainer,
  StoryScene,
  StorySeries,
  buildStoryTimeline,
  createInteractiveStory,
  resolveStoryPath,
} from "../src";

describe("@moritzbrantner/storytelling", () => {
  const branchingStory = createInteractiveStory({
    id: "signal",
    title: "Signal in the fog",
    openingNodeId: "wake",
    nodes: [
      {
        id: "wake",
        title: "Wake the observatory",
        body: "A low signal reaches the tower. You decide whether to answer it or trace it first.",
        prompt: "What should the operator do first?",
        choices: [
          {
            id: "answer",
            label: "Answer immediately",
            target: "answer-node",
          },
          {
            id: "trace",
            label: "Trace the source",
            target: "trace-node",
          },
        ],
      },
      {
        id: "answer-node",
        title: "A distant pilot responds",
        body: "The message is fragmented, but the pilot confirms the storm wall is moving fast.",
      },
      {
        id: "trace-node",
        title: "The map reveals a hidden harbor",
        body: "The signal comes from a cove nobody has charted in decades.",
      },
    ],
  });

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

  test("renders a branching story and advances when a choice is selected", async () => {
    render(<InteractiveStoryPlayer story={branchingStory} />);

    expect(screen.getAllByText("Wake the observatory").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Trace the source" }));

    expect(
      await screen.findByText(
        "The signal comes from a cove nobody has charted in decades.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Restart to explore another branch, or go back to choose a different path/),
    ).toBeTruthy();
  });

  test("resolves branching paths for interactive and remotion use cases", () => {
    const path = resolveStoryPath(branchingStory, ["answer"]);

    expect(path.nodes.map((node) => node.id)).toEqual(["wake", "answer-node"]);
    expect(path.completed).toBe(true);

    const timeline = buildStoryTimeline(branchingStory, ["trace"]);

    expect(timeline.scenes).toHaveLength(2);
    expect(timeline.totalFrames).toBe(240);
    expect(timeline.scenes[1]?.node.id).toBe("trace-node");
  });
});
