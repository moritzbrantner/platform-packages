# @moritzbrantner/remotion

Remotion helpers for rendering temporal map tracks and `@moritzbrantner/flat-design`
illustrations as frame-synced scenes.

## Main APIs

- `getRemotionMapTimeAtFrame(options)`
- `useRemotionMapTime({ tracks, ...timing })`
- `RemotionClusteredMap` and `RemotionHeatMap`
- `getRemotionFlatSceneTimeAtFrame(options)`
- `sampleFlatSceneAtTime(scene, timeInMs)`
- `useRemotionFlatScene({ scene, ...timing })`
- `RemotionFlatScene`

## Notes

- This package depends on `@moritzbrantner/maps`, `@moritzbrantner/flat-design`, and expects
  `remotion` as a peer dependency.

## Flat-design scenes

```tsx
import { RemotionFlatScene } from "@moritzbrantner/remotion";
import { createFlatCloudFigure, type FlatDesignScene } from "@moritzbrantner/flat-design";

const scene: FlatDesignScene = {
  width: 320,
  height: 180,
  title: "Cloud loop",
  background: "#F6F9FF",
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

export function CloudScene() {
  return <RemotionFlatScene scene={scene} />;
}
```

`RemotionFlatScene` samples `flat-design` motion and animation data on every frame and renders the
resolved SVG state through `FlatScene`.
