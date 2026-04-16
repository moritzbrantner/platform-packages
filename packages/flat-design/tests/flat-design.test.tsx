import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  FlatScene,
  createBobbingAnimation,
  createFlatDesignPalette,
  createFlatShowcaseScene,
  renderFlatSceneToSvg,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";

describe("@moritzbrantner/flat-design", () => {
  test("renders a scene through the React component", () => {
    const scene: FlatDesignScene = {
      width: 180,
      height: 120,
      title: "Flat badge",
      background: "#F6F9FF",
      layers: [
        {
          shapes: [
            {
              kind: "rect",
              x: 18,
              y: 20,
              width: 84,
              height: 54,
              rx: 18,
              fill: "#2D7FF9",
              animations: [createBobbingAnimation({ distance: 6, dur: "3s" })],
            },
            {
              kind: "circle",
              cx: 132,
              cy: 54,
              r: 22,
              fill: "#FFB347",
            },
          ],
        },
      ],
    };

    render(<FlatScene scene={scene} />);

    const svg = screen.getByRole("img", { name: "Flat badge" });
    expect(svg.querySelectorAll("rect")).toHaveLength(2);
    expect(svg.querySelector("animateTransform")).toBeTruthy();
    expect(svg.querySelector("circle")).toBeTruthy();
  });

  test("serializes gradients and animations into svg markup", () => {
    const svg = renderFlatSceneToSvg(
      createFlatShowcaseScene({
        animate: true,
        title: "Flat showcase",
      }),
      { width: 400, height: 240 },
    );

    expect(svg).toContain("<svg");
    expect(svg).toContain("linearGradient");
    expect(svg).toContain("animateTransform");
    expect(svg).toContain("Flat showcase");
    expect(svg).toContain("url(#flat-panel-gradient)");
  });

  test("merges palette overrides without dropping defaults", () => {
    const palette = createFlatDesignPalette({
      accent: "#111111",
      accentAlt: "#222222",
    });

    expect(palette.accent).toBe("#111111");
    expect(palette.accentAlt).toBe("#222222");
    expect(palette.background).toBeTruthy();
    expect(palette.highlight).toBeTruthy();
  });
});
