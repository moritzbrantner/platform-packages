import { describe, expect, test } from "vitest";

import { compileFlatMotion, resolveFlatMotion } from "./motion";
import { renderFlatSceneToSvg } from "./render-svg";
import type { FlatDesignScene } from "./scene-types";

describe("flat-design authored motion", () => {
  test("resolves presets into the canonical timeline model", () => {
    const motion = resolveFlatMotion({
      kind: "preset",
      preset: "pop",
      options: {
        begin: "250ms",
        dur: "2s",
        fillMode: "freeze",
        repeatCount: "2",
      },
    });

    expect(motion.kind).toBe("timeline");
    expect(motion.durationMs).toBe(2_000);
    expect(motion.delayMs).toBe(250);
    expect(motion.fillMode).toBe("freeze");
    expect(motion.repeatCount).toBe(2);
    expect(motion.easing).toEqual({
      type: "cubic-bezier",
      x1: 0.22,
      y1: 1,
      x2: 0.36,
      y2: 1,
    });
  });

  test("compiles typed timing and easing into SVG animation timing", () => {
    const animations = compileFlatMotion({
      kind: "timeline",
      durationMs: 1_200,
      delayMs: 200,
      easing: "ease-in-out",
      fillMode: "freeze",
      repeatCount: 3,
      keyframes: [
        { timeMs: 0, x: 0, opacity: 0.4 },
        { timeMs: 600, x: 20, opacity: 1 },
        { timeMs: 1_200, x: 0, opacity: 0.4 },
      ],
    });

    expect(animations).toHaveLength(2);
    for (const animation of animations) {
      expect(animation.begin).toBe("0.2s");
      expect(animation.dur).toBe("1.2s");
      expect(animation.repeatCount).toBe("3");
      expect(animation.fillMode).toBe("freeze");
      expect(animation.calcMode).toBe("spline");
      expect(animation.keySplines).toEqual([
        "0.42 0 0.58 1",
        "0.42 0 0.58 1",
      ]);
    }
  });

  test("keeps low-level animation arrays as an appended compatibility escape hatch", () => {
    const scene: FlatDesignScene = {
      width: 120,
      height: 80,
      layers: [
        {
          shapes: [
            {
              kind: "rect",
              x: 10,
              y: 10,
              width: 40,
              height: 30,
              motion: {
                kind: "timeline",
                durationMs: 1_000,
                keyframes: [
                  { timeMs: 0, x: 0 },
                  { timeMs: 1_000, x: 10 },
                ],
              },
              animations: [
                {
                  kind: "attribute",
                  attributeName: "opacity",
                  values: [1, 0.5, 1],
                  dur: "2s",
                },
              ],
            },
          ],
        },
      ],
    };

    const svg = renderFlatSceneToSvg(scene);

    expect(svg.match(/animateTransform/g)).toHaveLength(1);
    expect(svg.match(/<animate /g)).toHaveLength(1);
    expect(svg).toContain('begin="0s"');
  });

  test("expands alternate direction without renderer-specific authoring data", () => {
    const animations = compileFlatMotion({
      kind: "timeline",
      durationMs: 1_000,
      direction: "alternate",
      easing: "linear",
      keyframes: [
        { timeMs: 0, x: 0 },
        { timeMs: 1_000, x: 20 },
      ],
    });

    expect(animations).toHaveLength(1);
    expect(animations[0]?.keyTimes).toEqual([0, 0.5, 1]);
    expect(animations[0]?.calcMode).toBe("linear");
  });
});
