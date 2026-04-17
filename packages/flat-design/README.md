# @moritzbrantner/flat-design

Typed SVG primitives for building flat-design illustrations and lightweight animations.

## What it includes
- A scene schema for layered SVG artwork.
- Helper factories for bobbing, drift, pulse, opacity, and spin animations.
- Figure builders for common flat-design elements such as clouds, badges, cards, sparkles, and suns.
- A `FlatScene` React component for direct rendering.
- A `renderFlatSceneToSvg()` helper for exporting raw SVG strings.
- A ready-made `createFlatShowcaseScene()` preset you can customize or use as a starting point.

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
        createFlatCloudFigure({
          x: 92,
          y: 68,
          motion: { preset: "drift", options: { distance: 14 } },
        }),
        createFlatBadgeFigure({
          x: 204,
          y: 112,
          motion: { preset: "bobbing", options: { distance: 10 } },
        }),
      ],
    },
  ],
};

const svg = renderFlatSceneToSvg(scene);

export function Example() {
  return <FlatScene scene={scene} width={320} height={200} />;
}
```
