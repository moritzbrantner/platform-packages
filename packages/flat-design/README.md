# @moritzbrantner/flat-design

Typed SVG primitives for building flat-design illustrations, lightweight motion, and scene-data-first animation editors.

## What it includes

- A scene schema for layered SVG artwork.
- Figure builders for common flat-design elements such as clouds, badges, cards, sparkles, and suns.
- Low-level SVG animation helpers for bobbing, drift, float, pulse, pop, sway, blink, opacity, spin, and timeline motion.
- A high-level editable `motion` model for node animation authoring.
- `@moritzbrantner/flat-design/core` for node traversal, immutable scene updates, and motion editing helpers.
- `@moritzbrantner/flat-design/react` for `EditableFlatScene`, `FlatMotionTimelineEditor`, and `useFlatSceneSelection`.
- `FlatSceneEditor` for a package-backed SVG scene editor that composes canvas, tree, inspector, motion timeline, and SVG export.
- `FlatSvgSceneEditor` for SVG file import plus static-frame and animated SVG download workflows.
- A `FlatScene` React component for direct rendering.
- `importFlatSceneFromSvg()` for converting a safe, editable SVG subset into scene data with explicit compatibility diagnostics.
- `renderFlatSceneToSvg()` / `renderFlatSceneAnimationToSvg()` for animated SVG strings and `renderFlatSceneFrameToSvg()` for deterministic static frames.
- A ready-made `createFlatShowcaseScene()` preset you can customize or use as a starting point.

## Motion vs. animations

- Use `motion` when you want editable scene data. It is higher-level, timeline-aware, and compiles into SVG animation tags at render time.
- Use `animations` when you want to author raw low-level SVG animation arrays yourself.
- If both are present on a node, `motion` compiles first and `animations` are appended after it.
- Imported SVG `<animate>` / `<animateTransform>` elements stay in the low-level compatibility representation. Canonical authored motion remains the preferred model for new animation editing.

## SVG interchange

The importer is allow-list based rather than a raw-markup passthrough. It currently imports:

- `<g>`, `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<path>`, `<polygon>`, and `<polyline>` (converted to a path);
- IDs, classes, fill/stroke, stroke width/caps/joins, opacity, transforms, and the same presentation properties from inline `style`;
- linear/radial gradients and stops;
- `<animate attributeName="opacity">` and `<animateTransform>` for translate, scale, and rotate.

Unsupported constructs such as text, images, `<use>`, stylesheet rules, filters, masks, clip paths, scripts, foreign objects, motion-path animation, and unsupported presentation features are skipped and returned as `FlatSvgImportIssue` diagnostics. DTD-bearing XML is rejected. This makes an imported SVG a safe editable starting point without claiming that arbitrary SVG can be represented losslessly by the current scene schema.

A whole-animation export is normal SVG: authored `motion` is compiled to `<animate>` / `<animateTransform>` elements. A single-frame export first samples the scene deterministically at the requested `timeInMs`, removes the animation data from that sampled scene, and serializes the static SVG.

```ts
import {
  importFlatSceneFromSvg,
  renderFlatSceneAnimationToSvg,
  renderFlatSceneFrameToSvg,
} from "@moritzbrantner/flat-design";

const imported = importFlatSceneFromSvg(svgText);
const frame = renderFlatSceneFrameToSvg(imported.scene, 1_250);
const animation = renderFlatSceneAnimationToSvg(imported.scene);
```

For a file-oriented editor surface, use `FlatSvgSceneEditor`. It keeps the normal `FlatSceneEditor` controlled-scene contract and adds SVG import, frame-time selection, static-frame download, animated-SVG download, and import compatibility notes.

## Quick start

```tsx
import {
  FlatScene,
  createFlatBadgeFigure,
  createFlatCloudFigure,
  renderFlatSceneToSvg,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";

const scene: FlatDesignScene = {
  width: 320,
  height: 200,
  title: "Floating figures",
  background: "#F4F7FF",
  layers: [
    {
      shapes: [
        createFlatCloudFigure({ x: 92, y: 68 }),
        {
          ...createFlatBadgeFigure({ x: 204, y: 112 }),
          motion: {
            kind: "timeline",
            durationMs: 5_000,
            keyframes: [
              { timeMs: 0, x: 0, y: 0, scale: 1 },
              { timeMs: 2_500, x: 10, y: -12, scale: 1.08 },
              { timeMs: 5_000, x: 0, y: 0, scale: 1 },
            ],
          },
        },
      ],
    },
  ],
};

const svg = renderFlatSceneToSvg(scene);

export function Example() {
  return <FlatScene scene={scene} width={320} height={200} />;
}
```

## Editing scenes

```tsx
import { useState } from "react";

import {
  FlatSceneEditor,
  createFlatBadgeFigure,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";

const initialScene: FlatDesignScene = {
  width: 360,
  height: 240,
  title: "Editor demo",
  background: "#F4F7FF",
  layers: [
    {
      shapes: [
        createFlatBadgeFigure({
          id: "hero-badge",
          x: 180,
          y: 120,
        }),
      ],
    },
  ],
};

export function SceneEditorExample() {
  const [scene, setScene] = useState(initialScene);

  return <FlatSceneEditor scene={scene} onSceneChange={setScene} />;
}
```

## Editing scene motion

```tsx
import { useMemo, useState } from "react";

import {
  FlatScene,
  createFlatBadgeFigure,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";
import {
  createEditableMotionFromPreset,
  findFlatNodeById,
  setFlatNodeMotion,
} from "@moritzbrantner/flat-design/core";
import {
  EditableFlatScene,
  FlatMotionTimelineEditor,
  useFlatSceneSelection,
} from "@moritzbrantner/flat-design/react";

const initialScene: FlatDesignScene = {
  width: 320,
  height: 220,
  layers: [
    {
      shapes: [
        createFlatBadgeFigure({
          id: "hero-badge",
          x: 160,
          y: 110,
        }),
      ],
    },
  ],
};

export function MotionEditor() {
  const [scene, setScene] = useState(initialScene);
  const { selectedNode, selectedNodeRef, selectNode } = useFlatSceneSelection(scene);
  const motion = useMemo(
    () =>
      selectedNode?.motion?.kind === "timeline"
        ? selectedNode.motion
        : createEditableMotionFromPreset("pulse"),
    [selectedNode],
  );

  return (
    <div>
      <EditableFlatScene
        scene={scene}
        selectedNodeRef={selectedNodeRef}
        onSelectedNodeChange={selectNode}
        selectionClassName="selected-node"
      />

      <button
        type="button"
        onClick={() => {
          const ref = findFlatNodeById(scene, "hero-badge");

          if (!ref) {
            return;
          }

          setScene((currentScene) =>
            setFlatNodeMotion(currentScene, ref, createEditableMotionFromPreset("float")),
          );
        }}
      >
        Apply Float
      </button>

      <FlatMotionTimelineEditor
        motion={motion}
        onMotionChange={(nextMotion) => {
          if (!selectedNodeRef) {
            return;
          }

          setScene((currentScene) => setFlatNodeMotion(currentScene, selectedNodeRef, nextMotion));
        }}
      />
    </div>
  );
}
```
