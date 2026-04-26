# @moritzbrantner/three-starters

Starter components for `three.js` scenes built with React Three Fiber.

The first component is `HexGrid`, a reusable honeycomb grid rendered from instanced hex cells.

## Main APIs

- `HexGrid`
- `createHexGridLayout(options)`
- `createHoneycombCellGeometry(options)`

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
        depth={0.4}
        plane="xz"
        color="#f4b453"
        emissive="#8a4c12"
        position={[0, -1.5, 0]}
      />
    </Canvas>
  );
}
```
