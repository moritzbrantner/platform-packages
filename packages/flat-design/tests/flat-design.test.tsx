import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useState } from "react";

import {
  FlatSceneEditor,
  FlatMotionTimelineEditor,
  FlatScene,
  EditableFlatScene,
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
  type FlatNodeRef,
  type FlatTimelineMotionSpec,
} from "@moritzbrantner/flat-design";
import {
  compileFlatMotion,
  createEditableMotionFromPreset,
  duplicateFlatNode,
  findFlatNodeById,
  insertFlatNode,
  listFlatNodes,
  moveFlatNode,
  normalizeEditableMotion,
  removeFlatNode,
  setFlatNodeMotion,
  updateFlatSceneMetadata,
  updateFlatNode,
} from "../src/core";
import { FlatDesignPlaygroundPage } from "../../../examples/playground/src/flat-design-page";

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
    const motions = ["bobbing", "drift", "float", "pulse", "pop", "sway", "spin", "blink"] as const;

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

    expect(svg).toContain("translate(72 64)");
    expect(svg).toContain("translate(158 124)");
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

  test("compiles and renders high-level motion specs alongside raw animations", () => {
    const scene: FlatDesignScene = {
      width: 180,
      height: 120,
      title: "Motion scene",
      layers: [
        {
          shapes: [
            {
              kind: "rect",
              id: "animated-card",
              x: 20,
              y: 24,
              width: 80,
              height: 48,
              fill: "#2D7FF9",
              motion: {
                kind: "timeline",
                durationMs: 1_000,
                keyframes: [
                  { timeMs: 0, x: 0, opacity: 1 },
                  { timeMs: 1_000, x: 12, opacity: 0.5 },
                ],
              },
              animations: [createBobbingAnimation({ distance: 4, dur: "1s" })],
            },
          ],
        },
      ],
    };

    const compiled = compileFlatMotion(scene.layers[0]!.shapes[0]!.motion!);
    const svg = renderFlatSceneToSvg(scene);
    const { container } = render(<FlatScene scene={scene} />);

    expect(compiled).toHaveLength(2);
    expect(svg.match(/animateTransform/g)?.length ?? 0).toBe(2);
    expect(svg).toContain('attributeName="opacity"');
    expect(container.querySelectorAll("animateTransform")).toHaveLength(2);
    expect(container.querySelector('animate[attributeName="opacity"]')).toBeTruthy();
  });

  test("lists nodes depth-first and resolves node refs by id", () => {
    const scene: FlatDesignScene = {
      width: 120,
      height: 120,
      layers: [
        {
          shapes: [
            {
              kind: "group",
              id: "root-group",
              children: [
                {
                  kind: "rect",
                  id: "inner-rect",
                  x: 8,
                  y: 8,
                  width: 24,
                  height: 24,
                },
                {
                  kind: "group",
                  id: "cluster",
                  children: [{ kind: "circle", id: "dot", cx: 48, cy: 48, r: 8 }],
                },
              ],
            },
            {
              kind: "line",
              id: "divider",
              x1: 0,
              y1: 0,
              x2: 120,
              y2: 120,
            },
          ],
        },
      ],
    };

    const nodes = listFlatNodes(scene);

    expect(
      nodes.map((node) => ({
        id: node.id,
        depth: node.depth,
        path: node.ref.path.join("."),
      })),
    ).toEqual([
      { id: "root-group", depth: 0, path: "0" },
      { id: "inner-rect", depth: 1, path: "0.0" },
      { id: "cluster", depth: 1, path: "0.1" },
      { id: "dot", depth: 2, path: "0.1.0" },
      { id: "divider", depth: 0, path: "1" },
    ]);
    expect(findFlatNodeById(scene, "dot")).toEqual({
      layerIndex: 0,
      path: [0, 1, 0],
    });
    expect(findFlatNodeById(scene, "missing")).toBeUndefined();
  });

  test("updates, duplicates, moves, and removes nodes immutably", () => {
    const scene: FlatDesignScene = {
      width: 160,
      height: 100,
      layers: [
        {
          shapes: [
            { kind: "rect", id: "a", x: 0, y: 0, width: 20, height: 20, fill: "#111111" },
            { kind: "rect", id: "b", x: 24, y: 0, width: 20, height: 20, fill: "#222222" },
            { kind: "rect", id: "c", x: 48, y: 0, width: 20, height: 20, fill: "#333333" },
          ],
        },
      ],
    };

    const updated = updateFlatNode(scene, findFlatNodeById(scene, "b")!, (shape) => ({
      ...shape,
      fill: "#FFFFFF",
    }));
    const duplicated = duplicateFlatNode(updated, findFlatNodeById(updated, "b")!, {
      idSuffix: "-copy",
    });
    const moved = moveFlatNode(duplicated, findFlatNodeById(duplicated, "b-copy")!, {
      layerIndex: 0,
      index: 0,
    });
    const removed = removeFlatNode(moved, findFlatNodeById(moved, "b")!);

    expect(scene.layers[0]!.shapes.map((shape) => shape.id)).toEqual(["a", "b", "c"]);
    expect(updated.layers[0]!.shapes[1]!.fill).toBe("#FFFFFF");
    expect(duplicated.layers[0]!.shapes.map((shape) => shape.id)).toEqual([
      "a",
      "b",
      "b-copy",
      "c",
    ]);
    expect(moved.layers[0]!.shapes.map((shape) => shape.id)).toEqual(["b-copy", "a", "b", "c"]);
    expect(removed.layers[0]!.shapes.map((shape) => shape.id)).toEqual(["b-copy", "a", "c"]);
  });

  test("updates scene metadata and inserts nodes through public helpers", () => {
    const scene: FlatDesignScene = {
      width: 160,
      height: 100,
      title: "Before",
      background: "#ffffff",
      layers: [{ shapes: [] }],
    };

    const updated = updateFlatSceneMetadata(scene, {
      title: "After",
      width: 220,
      height: 140,
      background: "#f4f7ff",
    });
    const inserted = insertFlatNode(
      updated,
      { layerIndex: 0, index: 0 },
      createFlatBadgeFigure({ id: "badge-1" }),
    );

    expect(updated).toMatchObject({
      title: "After",
      width: 220,
      height: 140,
      background: "#f4f7ff",
    });
    expect(inserted.layers[0]!.shapes[0]!.id).toBe("badge-1");
  });

  test("normalizes editable timeline motion and maps presets into editable motions", () => {
    const motion = normalizeEditableMotion({
      kind: "timeline",
      durationMs: 50,
      keyframes: [
        { timeMs: 120, opacity: 2, scale: 5 },
        { timeMs: -20, opacity: -1, scale: 0.1 },
      ],
    });
    const pulse = createEditableMotionFromPreset("pulse", { dur: "2s" });

    expect(motion.durationMs).toBe(100);
    expect(motion.keyframes).toHaveLength(2);
    expect(motion.keyframes[0]).toMatchObject({
      timeMs: 0,
      opacity: 0,
      scale: 0.2,
    });
    expect(motion.keyframes[1]).toMatchObject({
      timeMs: 100,
      opacity: 1,
      scale: 3,
    });
    expect(pulse.durationMs).toBe(2_000);
    expect(pulse.keyframes[1]).toMatchObject({
      timeMs: 1_000,
      scale: 1.05,
      opacity: 0.72,
    });
  });

  test("supports node selection through EditableFlatScene", () => {
    const scene: FlatDesignScene = {
      width: 120,
      height: 120,
      title: "Editable scene",
      layers: [
        {
          shapes: [
            {
              kind: "group",
              id: "cluster",
              children: [{ kind: "circle", id: "dot", cx: 52, cy: 52, r: 16, fill: "#2D7FF9" }],
            },
          ],
        },
      ],
    };

    function Harness() {
      const [selectedNodeRef, setSelectedNodeRef] = useState<FlatNodeRef | undefined>();

      return (
        <>
          <EditableFlatScene
            scene={scene}
            selectedNodeRef={selectedNodeRef}
            onSelectedNodeChange={setSelectedNodeRef}
            selectionClassName="selected-node"
          />
          <div data-testid="selected-node-ref">
            {selectedNodeRef
              ? `${selectedNodeRef.layerIndex}:${selectedNodeRef.path.join(".")}`
              : "none"}
          </div>
        </>
      );
    }

    render(<Harness />);

    fireEvent.click(document.getElementById("dot")!);

    expect(screen.getByTestId("selected-node-ref").textContent).toBe("0:0.0");
    expect(document.getElementById("dot")?.getAttribute("class")).toContain("selected-node");
  });

  test("supports keyframe editing through FlatMotionTimelineEditor", () => {
    const initialMotion: FlatTimelineMotionSpec = {
      kind: "timeline",
      durationMs: 1_000,
      keyframes: [
        { timeMs: 0, x: 0 },
        { timeMs: 1_000, x: 8 },
      ],
    };

    function Harness() {
      const [motion, setMotion] = useState(initialMotion);
      const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0);

      return (
        <>
          <FlatMotionTimelineEditor
            motion={motion}
            selectedKeyframeIndex={selectedKeyframeIndex}
            onMotionChange={setMotion}
            onSelectedKeyframeIndexChange={setSelectedKeyframeIndex}
          />
          <div data-testid="motion-summary">
            {motion.durationMs}:{motion.keyframes.length}:
            {motion.keyframes.map((keyframe) => keyframe.x ?? 0).join(",")}:{selectedKeyframeIndex}
          </div>
        </>
      );
    }

    const { container } = render(<Harness />);
    const timelineRail = screen.getByRole("button", { name: "Motion timeline rail" });

    Object.defineProperty(timelineRail, "getBoundingClientRect", {
      value: () => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 100,
        bottom: 20,
        width: 100,
        height: 20,
        toJSON: () => undefined,
      }),
    });

    fireEvent.click(timelineRail, { clientX: 50 });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Motion duration" }), {
      target: { value: "2400" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Keyframe 2 x" }), {
      target: { value: "12" },
    });

    expect(screen.getByTestId("motion-summary").textContent).toBe("2400:3:0,12,8:1");

    fireEvent.click(screen.getByRole("button", { name: "Delete keyframe" }));

    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(screen.getByTestId("motion-summary").textContent).toBe("2400:2:0,8:0");
  });

  test("applies editable motion to a node with structural refs", () => {
    const scene: FlatDesignScene = {
      width: 120,
      height: 120,
      layers: [
        {
          shapes: [{ kind: "circle", id: "dot", cx: 40, cy: 40, r: 10, fill: "#2D7FF9" }],
        },
      ],
    };
    const motion = normalizeEditableMotion({
      kind: "timeline",
      durationMs: 1_200,
      keyframes: [
        { timeMs: 0, x: 0 },
        { timeMs: 1_200, x: 14 },
      ],
    });

    const nextScene = setFlatNodeMotion(scene, findFlatNodeById(scene, "dot")!, motion);

    expect(nextScene.layers[0]!.shapes[0]!.motion).toMatchObject({
      kind: "timeline",
      durationMs: 1_200,
    });
    expect(renderFlatSceneToSvg(nextScene)).toContain('dur="1.2s"');
  });

  test("supports scene editing, node insertion, preset motion, and timeline editing through FlatSceneEditor", () => {
    const initialScene: FlatDesignScene = {
      width: 320,
      height: 220,
      title: "Editor Demo",
      background: "#f5f8ff",
      layers: [
        {
          shapes: [
            createFlatCardFigure({
              id: "hero-card",
              x: 160,
              y: 110,
            }),
          ],
        },
      ],
    };

    function Harness() {
      const [scene, setScene] = useState(initialScene);

      return (
        <>
          <FlatSceneEditor scene={scene} onSceneChange={setScene} />
          <div data-testid="editor-summary">
            {scene.title}:{scene.width}:{scene.layers[0]!.shapes.length}:
            {scene.layers[0]!.shapes.map((shape) => shape.id ?? shape.kind).join(",")}:
            {scene.layers[0]!.shapes.map((shape) =>
              shape.motion ? shape.motion.kind : "none",
            ).join(",")}
            :{renderFlatSceneToSvg(scene).includes('dur="2.1s"') ? "dur-2.1" : "dur-other"}
          </div>
        </>
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Scene title"), {
      target: { value: "Editor Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Sun" }));
    fireEvent.click(screen.getByRole("button", { name: "pulse" }));
    fireEvent.click(screen.getByRole("button", { name: "Use timeline" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Motion duration" }), {
      target: { value: "2100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Scene root" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Width" }), {
      target: { value: "480" },
    });

    expect(screen.getByTestId("editor-summary").textContent).toBe(
      "Editor Updated:480:2:hero-card,sun:none,timeline:dur-2.1",
    );
  });

  test("renders the flat-design playground page through the package-backed editor", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });

    render(<FlatDesignPlaygroundPage />);

    expect(screen.getByText("Scene-native SVG editor")).toBeTruthy();
    expect(screen.getByText("Flat Scene Editor")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add Cloud" })).toBeTruthy();
  });
});
