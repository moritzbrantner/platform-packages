# @moritzbrantner/three-starters

Starter components for `three.js` scenes built with React Three Fiber.

The package currently includes `HexGrid` for low-level honeycomb scenes and `HexTileNavigation` for a higher-level interactive navigation surface.

## Main APIs

- `HexGrid`
- `HexTileNavigation`
- `createHexGridLayout(options)`
- `createHoneycombCellGeometry(options)`
- `getHexGridCellTransform(cell, height)`

## Example

```tsx
import { Canvas } from "@react-three/fiber";
import { HexGrid } from "@moritzbrantner/three-starters";

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 6, 8], fov: 42 }}>
      <color attach="background" args={["#120d07"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1.5} />
      <HexGrid
        rows={8}
        columns={9}
        radius={0.7}
        gap={0.08}
        wallThickness={0.22}
        tileHeight={(cell) => 0.2 + ((cell.row + cell.column) % 4) * 0.18}
        plane="xz"
        color="#f4b453"
        emissive="#8a4c12"
        position={[0, -1.5, 0]}
      />
    </Canvas>
  );
}
```

`depth` still works as the default uniform height. Use `tileHeight` when you want to vary height per honeycomb.

## Navigation Example

```tsx
import { HexTileNavigation } from "@moritzbrantner/three-starters";

const items = [
  {
    id: "brief",
    label: "Project brief",
    description: "Frame the current objective before branching into deeper routes.",
  },
  {
    id: "flows",
    label: "Route map",
    description: "Review the navigation geometry and choose the next destination.",
  },
];

export function NavigationDemo() {
  return <HexTileNavigation items={items} columns={2} />;
}
```

`HexTileNavigation` wraps the shared `HexGrid` scene with click handling, arrow-key traversal, and a destination detail panel.
