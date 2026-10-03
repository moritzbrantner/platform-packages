# Flat-design workbench

`FlatDesignWorkbench` is the direct-manipulation editor for `FlatDesignScene`. `FlatSceneEditor` remains available for compatibility and form-oriented editing.

The workbench deliberately executes scene changes through the same immutable command layer exported by `applyFlatEditorCommand()`. Canvas gestures, toolbar actions, and keyboard actions therefore share mutation semantics.

## Interaction model

- Drag a rendered shape to move it. Optional grid snapping is applied to the gesture delta.
- Drag the selected shape's corner handle to resize it.
- Drag its rotation handle to edit the SVG rotation transform.
- Shift-click shapes or scene-tree rows for multi-selection.
- Drag empty canvas space for marquee selection.
- Arrow keys nudge by 1px; Shift+Arrow nudges by 10px.
- Undo/redo keeps one snapshot per continuous pointer gesture instead of one entry per pointer move.

## Authoring tools

The toolbar creates editable rectangles, circles, ellipses, lines, polygons, and paths directly. Hosts can continue supplying packaged figure definitions through `availableFigures`.

The layer panel supports create, rename, delete, and drag-to-reorder. Selected nodes can move across layers. Hide/lock controls are intentionally editor-session state rather than authored scene data, so they do not change SVG output or the persisted document contract.

Sibling selections can be grouped into a `FlatGroup`, and selected groups can be ungrouped again. The existing typed motion timeline remains available in the workbench inspector.

## SVG editor

`FlatSvgSceneEditor` now composes `FlatDesignWorkbench` with the loss-aware SVG import and deterministic static/animated SVG export toolbar. This keeps A2 sampling authoritative and does not introduce a second rendering or timing model.
