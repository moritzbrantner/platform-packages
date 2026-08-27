import { describe, expect, test } from "vitest";

import { createFlatCloudFigure } from "./figures";
import {
  getFlatAnimationProgress,
  sampleFlatAnimationAtTime,
  sampleFlatSceneAtTime,
} from "./sampling";
import type { FlatDesignScene } from "./scene-types";

describe("flat-design deterministic sampling", () => {
  test("samples canonical timeline motion into a static scene", () => {
    const scene: FlatDesignScene = {
      width: 240,
      height: 160,
      title: "Sampled card",
      layers: [
        {
          shapes: [
            {
              kind: "rect",
              id: "card",
              x: 24,
              y: 20,
              width: 96,
              height: 64,
              opacity: 1,
              transform: "translate(12 0)",
              motion: {
                kind: "timeline",
                durationMs: 1_000,
                easing: "linear",
                keyframes: [
                  { timeMs: 0, x: 0, opacity: 1, scale: 1 },
                  { timeMs: 1_000, x: 20, opacity: 0.5, scale: 1.2 },
                ],
              },
            },
          ],
        },
      ],
    };

    const sampled = sampleFlatSceneAtTime(scene, 500);
    const card = sampled.layers[0]?.shapes[0];

    expect(card).toMatchObject({
      id: "card",
      opacity: 0.75,
      transform: "translate(12 0) translate(10 0) scale(1.1)",
    });
    expect(card?.motion).toBeUndefined();
    expect(card?.animations).toBeUndefined();
    expect(scene.layers[0]?.shapes[0]?.motion).toBeDefined();
  });

  test("preserves legacy figure animation semantics", () => {
    const scene: FlatDesignScene = {
      width: 320,
      height: 180,
      layers: [
        {
          shapes: [
            createFlatCloudFigure({
              id: "hero-cloud",
              x: 160,
              y: 96,
              motion: {
                preset: "bobbing",
                options: { distance: 10, dur: "3s" },
              },
            }),
          ],
        },
      ],
    };

    const cloud = sampleFlatSceneAtTime(scene, 1_500).layers[0]?.shapes[0];

    expect(cloud).toMatchObject({
      id: "hero-cloud",
      transform: "translate(160 96) translate(0 -10)",
    });
    expect(cloud?.animations).toBeUndefined();
    expect(cloud?.motion).toBeUndefined();
  });

  test("honors typed delay and freeze fill through the canonical compiler", () => {
    const scene: FlatDesignScene = {
      width: 120,
      height: 80,
      layers: [
        {
          shapes: [
            {
              kind: "circle",
              cx: 20,
              cy: 20,
              r: 10,
              opacity: 1,
              motion: {
                kind: "timeline",
                durationMs: 1_000,
                delayMs: 500,
                easing: "linear",
                fillMode: "freeze",
                repeatCount: 1,
                keyframes: [
                  { timeMs: 0, x: 0, opacity: 1 },
                  { timeMs: 1_000, x: 20, opacity: 0.5 },
                ],
              },
            },
          ],
        },
      ],
    };

    const before = sampleFlatSceneAtTime(scene, 250).layers[0]?.shapes[0];
    const middle = sampleFlatSceneAtTime(scene, 1_000).layers[0]?.shapes[0];
    const after = sampleFlatSceneAtTime(scene, 2_000).layers[0]?.shapes[0];

    expect(before).toMatchObject({ opacity: 1 });
    expect(before?.transform).toBeUndefined();
    expect(middle).toMatchObject({ opacity: 0.75, transform: "translate(10 0)" });
    expect(after).toMatchObject({ opacity: 0.5, transform: "translate(20 0)" });
  });

  test("samples raw low-level animations as a compatibility escape hatch", () => {
    const animation = {
      kind: "transform" as const,
      transformType: "translate" as const,
      values: [
        { x: 0, y: 0 },
        { x: 30, y: -10 },
      ],
      dur: "2s",
      repeatCount: "1",
    };

    expect(sampleFlatAnimationAtTime(animation, 1_000)).toMatchObject({
      kind: "transform",
      value: { x: 15, y: -5 },
    });
    expect(getFlatAnimationProgress(animation, 2_000)).toBe(1);
    expect(sampleFlatAnimationAtTime(animation, 2_001)).toBeUndefined();
  });

  test("is deterministic for cubic-bezier sampling", () => {
    const animation = {
      kind: "attribute" as const,
      attributeName: "opacity",
      values: [0, 1],
      dur: "1s",
      calcMode: "spline" as const,
      keyTimes: [0, 1],
      keySplines: ["0.42 0 1 1"],
    };

    const first = sampleFlatAnimationAtTime(animation, 500);
    const second = sampleFlatAnimationAtTime(animation, 500);

    expect(first).toEqual(second);
    expect(first?.kind).toBe("attribute");
    if (first?.kind === "attribute") {
      expect(Number(first.value)).toBeGreaterThan(0);
      expect(Number(first.value)).toBeLessThan(0.5);
    }
  });
});
