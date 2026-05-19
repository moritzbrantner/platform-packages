import { type ThreeEvent, type ThreeElements } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D, type ColorRepresentation } from "three";

import {
  createHexGridLayout,
  createHoneycombCellGeometry,
  getHexGridCellTransform,
  type CreateHexGridLayoutOptions,
  type CreateHoneycombCellGeometryOptions,
  type HexGridCell,
  type HexGridPlane,
} from "./core";

export interface HexGridProps
  extends
    Omit<ThreeElements["group"], "children" | "rotation" | "scale">,
    CreateHexGridLayoutOptions,
    CreateHoneycombCellGeometryOptions {
  plane?: HexGridPlane;
  tileHeight?: number | ((cell: HexGridCell) => number);
  color?: ColorRepresentation;
  emissive?: ColorRepresentation;
  roughness?: number;
  metalness?: number;
  cellColor?: ColorRepresentation | ((cell: HexGridCell) => ColorRepresentation);
  onCellClick?: (cell: HexGridCell, event: ThreeEvent<MouseEvent>) => void;
  onCellPointerMove?: (cell: HexGridCell, event: ThreeEvent<PointerEvent>) => void;
  onCellPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

const DEFAULT_COLOR = "#f4b453";
const DEFAULT_EMISSIVE = "#8a4c12";
const DEFAULT_ROUGHNESS = 0.45;
const DEFAULT_METALNESS = 0.08;

export function HexGrid({
  rows,
  columns,
  radius = 1,
  gap = 0.08,
  center = true,
  wallThickness = 0.24,
  depth = 0.35,
  plane = "xz",
  tileHeight = depth,
  color = DEFAULT_COLOR,
  emissive = DEFAULT_EMISSIVE,
  roughness = DEFAULT_ROUGHNESS,
  metalness = DEFAULT_METALNESS,
  cellColor,
  onCellClick,
  onCellPointerMove,
  onCellPointerOut,
  ...groupProps
}: HexGridProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const tempColor = useMemo(() => new Color(), []);
  const layout = useMemo(
    () =>
      createHexGridLayout({
        rows,
        columns,
        radius,
        gap,
        center,
      }),
    [center, columns, gap, radius, rows],
  );
  const geometry = useMemo(
    () =>
      createHoneycombCellGeometry({
        radius,
        wallThickness,
        depth: 1,
      }),
    [radius, wallThickness],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    for (const cell of layout.cells) {
      const resolvedHeight = typeof tileHeight === "function" ? tileHeight(cell) : tileHeight;
      const transform = getHexGridCellTransform(cell, resolvedHeight);

      tempObject.position.set(...transform.position);
      tempObject.rotation.set(0, 0, 0);
      tempObject.scale.set(...transform.scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(cell.index, tempObject.matrix);

      if (cellColor) {
        const resolvedColor = typeof cellColor === "function" ? cellColor(cell) : cellColor;
        tempColor.set(resolvedColor);
        mesh.setColorAt(cell.index, tempColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [cellColor, layout.cells, tempColor, tempObject, tileHeight]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group rotation={getPlaneRotation(plane)} {...groupProps}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, layout.cells.length]}
        onClick={
          onCellClick
            ? (event) => {
                const instanceId = event.instanceId;

                if (instanceId == null) {
                  return;
                }

                const cell = layout.cells[instanceId];

                if (!cell) {
                  return;
                }

                onCellClick(cell, event);
              }
            : undefined
        }
        onPointerMove={
          onCellPointerMove
            ? (event) => {
                const instanceId = event.instanceId;

                if (instanceId == null) {
                  return;
                }

                const cell = layout.cells[instanceId];

                if (!cell) {
                  return;
                }

                onCellPointerMove(cell, event);
              }
            : undefined
        }
        onPointerOut={onCellPointerOut}
      >
        <primitive attach="geometry" object={geometry} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          roughness={roughness}
          metalness={metalness}
          vertexColors={Boolean(cellColor)}
        />
      </instancedMesh>
    </group>
  );
}

function getPlaneRotation(plane: HexGridPlane): ThreeElements["group"]["rotation"] {
  if (plane === "xy") {
    return [0, 0, 0];
  }

  if (plane === "yz") {
    return [0, Math.PI / 2, 0];
  }

  return [-Math.PI / 2, 0, 0];
}
