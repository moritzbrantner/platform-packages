import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  FlatScene,
  createBobbingAnimation,
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatDesignPalette,
  createFlatFigureAnimations,
  createFlatSparkleFigure,
  createFlatShowcaseScene,
  createFlatSunFigure,
  createTimelineAnimations,
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

  test("builds reusable figures with packaged motion presets", () => {
    const motions = [
      "bobbing",
      "drift",
      "float",
      "pulse",
      "pop",
      "sway",
      "spin",
      "blink",
    ] as const;

    for (const motion of motions) {
      const figures = [
        createFlatCloudFigure({ motion }),
        createFlatSparkleFigure({ motion }),
        createFlatBadgeFigure({ motion }),
        createFlatCardFigure({ motion }),
        createFlatSunFigure({ motion }),
      ];

      for (const figure of figures) {
        expect(figure.kind).toBe("group");
        expect(figure.children.length).toBeGreaterThan(0);
        expect(figure.animations?.length).toBe(motion === "pulse" ? 2 : 1);
        for (const animation of figure.animations ?? []) {
          if (animation.kind === "transform") {
            expect(animation.additive).toBe("sum");
          }
        }
      }
    }
  });

  test("serializes figure helper animations into svg markup", () => {
    const scene: FlatDesignScene = {
      width: 320,
      height: 220,
      title: "Figure helpers",
      layers: [
        {
          shapes: [
            createFlatCloudFigure({
              x: 72,
              y: 64,
              motion: { preset: "drift", options: { distance: 10, dur: "8s" } },
            }),
            createFlatBadgeFigure({
              x: 158,
              y: 124,
              motion: { preset: "bobbing", options: { distance: 8, dur: "4s" } },
            }),
            createFlatSparkleFigure({
              x: 252,
              y: 58,
              motion: {
                preset: "pulse",
                options: { from: 0.9, to: 1.12, minOpacity: 0.5, dur: "5s" },
              },
            }),
          ],
        },
      ],
    };

    const svg = renderFlatSceneToSvg(scene);

    expect(svg).toContain('translate(72 64)');
    expect(svg).toContain('translate(158 124)');
    expect(svg).toContain('additive="sum"');
    expect(svg.match(/animateTransform/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(svg).toContain('attributeName="opacity"');
  });

  test("creates timeline motion from configured keyframes", () => {
    const animations = createTimelineAnimations({
      dur: "4s",
      keyframes: [
        { time: 0, x: 0, y: 0, scale: 1, opacity: 1 },
        { time: 0.5, x: 14, y: -8, scale: 1.08, opacity: 0.7 },
        { time: 1, x: 0, y: 0, scale: 1, opacity: 1 },
      ],
    });

    expect(animations).toHaveLength(3);
    expect(animations[0]).toMatchObject({
      kind: "transform",
      transformType: "translate",
      additive: "sum",
      keyTimes: [0, 0.5, 1],
    });
    expect(animations[1]).toMatchObject({
      kind: "transform",
      transformType: "scale",
      additive: "sum",
    });
    expect(animations[2]).toMatchObject({
      kind: "attribute",
      attributeName: "opacity",
    });
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

  test("maps motion presets to svg animation arrays", () => {
    expect(createFlatFigureAnimations("bobbing")?.length).toBe(1);
    expect(createFlatFigureAnimations("drift")?.length).toBe(1);
    expect(createFlatFigureAnimations("float")?.length).toBe(1);
    expect(createFlatFigureAnimations("pulse")?.length).toBe(2);
    expect(createFlatFigureAnimations("pop")?.length).toBe(1);
    expect(createFlatFigureAnimations("sway")?.length).toBe(1);
    expect(createFlatFigureAnimations("spin")?.length).toBe(1);
    expect(createFlatFigureAnimations("blink")?.length).toBe(1);
    expect(
      createFlatFigureAnimations({
        preset: "timeline",
        options: {
          keyframes: [
            { time: 0, x: 0 },
            { time: 1, x: 10 },
          ],
        },
      })?.length,
    ).toBe(1);
    expect(createFlatFigureAnimations(false)).toBeUndefined();
  });
});
