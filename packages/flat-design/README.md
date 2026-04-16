# @moritzbrantner/flat-design

Typed SVG primitives for building flat-design illustrations and lightweight animations.

## What it includes
- A scene schema for layered SVG artwork.
- Helper factories for bobbing, drift, pulse, opacity, and spin animations.
- A `FlatScene` React component for direct rendering.
- A `renderFlatSceneToSvg()` helper for exporting raw SVG strings.
- A ready-made `createFlatShowcaseScene()` preset you can customize or use as a starting point.

## Quick start
```tsx
import {
  FlatScene,
  createBobbingAnimation,
  renderFlatSceneToSvg,
  type FlatDesignScene,
} from "@moritzbrantner/flat-design";

const scene: FlatDesignScene = {
  width: 320,
  height: 200,
  title: "Floating tile",
  background: "#F4F7FF",
  layers: [
    {
      shapes: [
        {
          kind: "rect",
          x: 48,
          y: 52,
          width: 160,
          height: 96,
          rx: 28,
          fill: "#2D7FF9",
          animations: [createBobbingAnimation({ distance: 10 })],
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
