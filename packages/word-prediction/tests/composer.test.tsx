import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { WordPredictionComposer, createWordPredictionModel } from "@moritzbrantner/word-prediction";

describe("@moritzbrantner/word-prediction composer", () => {
  test("shows suggestion words without score or context by default", () => {
    const model = createWordPredictionModel({
      texts: [
        "See you soon.",
        "See you tomorrow.",
        "See you soon.",
      ],
    });

    render(<WordPredictionComposer model={model} defaultValue="See you " />);

    expect(screen.getByRole("button", { name: /soon/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /tomorrow/i })).toBeTruthy();
    expect(screen.queryByText(/^Score /i)).toBeNull();
    expect(screen.queryByText(/^Context /i)).toBeNull();
  });

  test("reveals score and context when the toggles are enabled", () => {
    const model = createWordPredictionModel({
      texts: [
        "See you soon.",
        "See you tomorrow.",
        "See you soon.",
      ],
    });

    render(<WordPredictionComposer model={model} defaultValue="See you " />);

    fireEvent.click(screen.getByRole("button", { name: "Show score" }));
    fireEvent.click(screen.getByRole("button", { name: "Show context" }));

    expect(screen.getAllByText(/^Score /i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Context See you").length).toBeGreaterThan(0);
  });

  test("accepts the indexed suggestion with ctrl plus number", () => {
    const model = createWordPredictionModel({
      texts: [
        "On my way now.",
        "On my way home.",
        "On my wall art.",
      ],
    });

    render(<WordPredictionComposer model={model} defaultValue="On my wa" />);

    const textbox = screen.getByRole("textbox", { name: "Compose message" });
    fireEvent.keyDown(textbox, { key: "1", ctrlKey: true });

    expect((textbox as HTMLTextAreaElement).value).toBe("On my way ");
  });
});
