# @moritzbrantner/maps

React map components, density aggregation helpers, and temporal geo features for interactive spatial views.

## Main APIs

- `ClusteredMap`, `HeatMap`, `TemporalClusteredMap`, and `TemporalHeatMap`
- `createPointAggregationIndex(...)`, `createHeatMapDensityIndex(...)`, and `createTemporalMapTracksFromGeoJson(...)`
- `createTemporalGeoJsonTracksFromGeoJson(...)`, `getTemporalGeoJsonFeatureCollectionAtTime(...)`, and `createTemporalGeoJsonPlaybackIndex(...)`

## Dense Temporal GeoJSON

Use `createTemporalGeoJsonPlaybackIndex(...)` when the same temporal GeoJSON tracks are queried many times during playback. The index precomputes sampling and ring preparation so dense polygons and multipolygons do not pay that setup cost on every frame.

```ts
import {
  createTemporalGeoJsonPlaybackIndex,
  createTemporalGeoJsonTracksFromGeoJson,
} from "@moritzbrantner/maps";

const tracks = createTemporalGeoJsonTracksFromGeoJson(collection);

const playbackIndex = createTemporalGeoJsonPlaybackIndex(tracks, {
  strategy: "compatible",
  maxCoordinatesPerRing: 96,
});

const frameData = playbackIndex.getFeatureCollectionAtTime(currentTime);
```

By default, dense compatible lines and rings are resampled to the configured playback budget when they exceed `maxCoordinatesPerLine` or `maxCoordinatesPerRing`. Use `denseGeometryBehavior: "preserve"` if you want the prepared index to keep the exact `compatible` interpolation semantics instead of switching dense shapes to bounded playback geometry.

## Notes

- Import `@moritzbrantner/maps/styles.css` once in the consuming app to load the package styles.
