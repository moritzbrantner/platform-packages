# @moritzbrantner/maps

React map components, density aggregation helpers, and temporal geo features for interactive spatial views.

## Main APIs

- `ClusteredMap`, `HeatMap`, `TemporalClusteredMap`, and `TemporalHeatMap`
- `createPointAggregationIndex(...)`, `createHeatMapDensityIndex(...)`, and `createTemporalMapTracksFromGeoJson(...)`
- `createTemporalGeoJsonTracksFromGeoJson(...)` and `getTemporalGeoJsonFeatureCollectionAtTime(...)`

## Notes

- Import `@moritzbrantner/maps/styles.css` once in the consuming app to load the package styles.
