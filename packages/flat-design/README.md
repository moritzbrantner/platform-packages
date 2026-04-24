# @moritzbrantner/flat-design

Typed SVG primitives for building flat-design illustrations, lightweight motion, and scene-data-first animation editors.

## What it includes

- A scene schema for layered SVG artwork.
- Figure builders for common flat-design elements such as clouds, badges, cards, sparkles, and suns.
- Low-level SVG animation helpers for bobbing, drift, float, pulse, pop, sway, blink, opacity, spin, and timeline motion.
- A high-level editable `motion` model for node animation authoring.
- `@moritzbrantner/flat-design/core` for node traversal, immutable scene updates, and motion editing helpers.
- `@moritzbrantner/flat-design/react` for `EditableFlatScene`, `FlatMotionTimelineEditor`, and `useFlatSceneSelection`.
- A `FlatScene` React component for direct rendering.
- A `renderFlatSceneToSvg()` helper for exporting raw SVG strings.
- A ready-made `createFlatShowcaseScene()` preset you can customize or use as a starting point.

## Motion vs. animations

- Use `motion` when you want editable scene data. It is higher-level, timeline-aware, and compiles into SVG animation tags at render time.
- Use `animations` when you want to author raw low-level SVG animation arrays yourself.
- If both are present on a node, `motion` compiles first and `animations` are appended after it.

This release focuses on editing `FlatDesignScene` data created inside the package. It does not parse arbitrary external SVG files into editable scene data.

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
