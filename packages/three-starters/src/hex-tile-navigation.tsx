import { Canvas } from "@react-three/fiber";
import { useMemo, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";
import { Color, type ColorRepresentation } from "three";

import { createHexGridLayout, getHexGridCellPosition } from "./core";
import { HexGrid } from "./hex-grid";

export interface HexTileNavigationItem {
  id: string;
  label: string;
  description: string;
  eyebrow?: string;
  meta?: string;
  accentColor?: ColorRepresentation;
}

export type HexTileNavigationDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right";

export interface HexTileNavigationProps
  extends Omit<ComponentProps<"section">, "children" | "onChange"> {
  items: readonly HexTileNavigationItem[];
  columns: number;
  rows?: number;
  title?: string;
  description?: string;
  activeItemId?: string;
  initialActiveItemId?: string;
  onActiveItemChange?: (item: HexTileNavigationItem, index: number) => void;
  canvasHeight?: number | string;
  radius?: number;
  gap?: number;
  tileDepth?: number;
  tileLift?: number;
}

const DEFAULT_TITLE = "Hex tile navigation";
const DEFAULT_DESCRIPTION =
  "Click a tile or use the arrow keys or Q/W/E/A/S/D to move through the grid and inspect each destination.";
const DEFAULT_CANVAS_HEIGHT = 380;
const DEFAULT_RADIUS = 0.9;
const DEFAULT_GAP = 0.12;
const DEFAULT_TILE_DEPTH = 0.34;
const DEFAULT_TILE_LIFT = 0.38;
const FALLBACK_ACCENT_COLORS = [
  "#f97316",
  "#f59e0b",
  "#14b8a6",
  "#38bdf8",
  "#818cf8",
  "#ec4899",
] as const;
const HEX_KEYBOARD_DIRECTIONS = {
  q: "up-left",
  w: "up",
  e: "up-right",
  a: "down-left",
  s: "down",
  d: "down-right",
} as const satisfies Record<string, HexTileNavigationDirection>;

export function HexTileNavigation({
  items,
  columns,
  rows: rowsProp,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  activeItemId,
  initialActiveItemId,
  onActiveItemChange,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  radius = DEFAULT_RADIUS,
  gap = DEFAULT_GAP,
  tileDepth = DEFAULT_TILE_DEPTH,
  tileLift = DEFAULT_TILE_LIFT,
  className,
  style,
  ...sectionProps
}: HexTileNavigationProps) {
  assertPositiveInteger(columns, "columns");

  const rows = rowsProp ?? Math.max(1, Math.ceil(items.length / columns));
  const layout = useMemo(
    () =>
      createHexGridLayout({
        rows,
        columns,
        radius,
        gap,
        center: true,
      }),
    [columns, gap, radius, rows],
  );
  const resolvedCanvasHeight = typeof canvasHeight === "number" ? `${canvasHeight}px` : canvasHeight;
  const [uncontrolledActiveItemId, setUncontrolledActiveItemId] = useState(
    initialActiveItemId ?? items[0]?.id ?? "",
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const controlledIndex = activeItemId == null ? -1 : items.findIndex((item) => item.id === activeItemId);
  const uncontrolledIndex = items.findIndex((item) => item.id === uncontrolledActiveItemId);
  const activeIndex = controlledIndex >= 0 ? controlledIndex : uncontrolledIndex >= 0 ? uncontrolledIndex : 0;
  const activeItem = items[activeIndex];
  const colorPalette = useMemo(
    () =>
      items.map((item, index) =>
        new Color(item.accentColor ?? FALLBACK_ACCENT_COLORS[index % FALLBACK_ACCENT_COLORS.length]),
      ),
    [items],
  );
  const activeCell = layout.cells[activeIndex];
  const activeCellPosition = activeCell ? getHexGridCellPosition(activeCell, "xz") : null;
  const activeLightHeight = tileDepth + tileLift + 1.2;
  const cameraDistance = Math.max(layout.width * 1.05, layout.height * 1.4, 6.4);

  const selectIndex = (index: number) => {
    const item = items[index];

    if (!item) {
      return;
    }

    if (activeItemId == null) {
      setUncontrolledActiveItemId(item.id);
    }

    onActiveItemChange?.(item, index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    let direction: HexTileNavigationDirection | null = null;
    const normalizedKey = event.key.toLowerCase();

    if (normalizedKey in HEX_KEYBOARD_DIRECTIONS) {
      direction = HEX_KEYBOARD_DIRECTIONS[normalizedKey as keyof typeof HEX_KEYBOARD_DIRECTIONS];
    } else if (event.key === "ArrowLeft") {
      direction = "left";
    } else if (event.key === "ArrowRight") {
      direction = "right";
    } else if (event.key === "ArrowUp") {
      direction = "up";
    } else if (event.key === "ArrowDown") {
      direction = "down";
    }

    if (!direction) {
      return;
    }

    const nextIndex = getHexTileNavigationNeighborIndex(activeIndex, direction, items.length, columns, rows);

    if (nextIndex !== activeIndex) {
      event.preventDefault();
      selectIndex(nextIndex);
    }
  };

  return (
    <section
      {...sectionProps}
      className={className}
      onKeyDown={handleKeyDown}
      style={{
        ...rootStyle,
        ...style,
      }}
      tabIndex={0}
    >
      <div style={headerStyle}>
        <div style={eyebrowStyle}>3D navigation</div>
        <h2 style={titleStyle}>{title}</h2>
        <p style={descriptionStyle}>{description}</p>
      </div>

      <div style={{ ...stageStyle, minHeight: resolvedCanvasHeight }}>
        <Canvas camera={{ position: [0, cameraDistance, cameraDistance * 0.62], fov: 34 }}>
          <color attach="background" args={["#0b1020"]} />
          <fog attach="fog" args={["#0b1020", cameraDistance * 0.8, cameraDistance * 1.8]} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 9, 5]} intensity={2.4} color="#fff1cf" />
          <pointLight position={[-6, 4, -4]} intensity={20} distance={20} color="#60a5fa" />
          {activeCellPosition ? (
            <pointLight
              position={[activeCellPosition[0], activeLightHeight, activeCellPosition[2]]}
              intensity={28}
              distance={12}
              color={colorPalette[activeIndex]?.getStyle() ?? "#f59e0b"}
            />
          ) : null}

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <circleGeometry args={[Math.max(layout.width, layout.height) * 0.95, 64]} />
            <meshStandardMaterial color="#111827" metalness={0.15} roughness={0.92} />
          </mesh>

          {activeCellPosition ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[activeCellPosition[0], 0.02, activeCellPosition[2]]}>
              <ringGeometry args={[radius * 0.82, radius * 1.12, 6]} />
              <meshBasicMaterial
                color={colorPalette[activeIndex]?.getStyle() ?? "#f59e0b"}
                transparent
                opacity={0.95}
              />
            </mesh>
          ) : null}

          <HexGrid
            rows={rows}
            columns={columns}
            radius={radius}
            gap={gap}
            wallThickness={radius * 0.24}
            depth={1}
            plane="xz"
            color="#1f2937"
            emissive="#0f172a"
            roughness={0.42}
            metalness={0.08}
            tileHeight={(cell) => {
              if (cell.index === activeIndex) {
                return tileDepth + tileLift;
              }

              if (cell.index === hoveredIndex) {
                return tileDepth + tileLift * 0.45;
              }

              return cell.index < items.length ? tileDepth : tileDepth * 0.55;
            }}
            cellColor={(cell) => {
              if (cell.index >= items.length) {
                return "#172033";
              }

              const tone = colorPalette[cell.index] ?? new Color(FALLBACK_ACCENT_COLORS[0]);

              if (cell.index === activeIndex) {
                return tone.clone().lerp(new Color("#ffffff"), 0.12).getStyle();
              }

              if (cell.index === hoveredIndex) {
                return tone.clone().lerp(new Color("#0f172a"), 0.18).getStyle();
              }

              return tone.clone().lerp(new Color("#020617"), 0.38).getStyle();
            }}
            onCellClick={(cell) => {
              selectIndex(cell.index);
            }}
            onCellPointerMove={(cell) => {
              if (cell.index < items.length) {
                setHoveredIndex(cell.index);
              }
            }}
            onCellPointerOut={() => {
              setHoveredIndex(null);
            }}
          />
        </Canvas>
      </div>

      <div style={toolbarStyle}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            selectIndex(
              getHexTileNavigationNeighborIndex(activeIndex, "left", items.length, columns, rows),
            )
          }
        >
          Previous
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            selectIndex(
              getHexTileNavigationNeighborIndex(activeIndex, "right", items.length, columns, rows),
            )
          }
        >
          Next
        </button>
        <div style={hintStyle}>Use arrow keys or Q/W/E/A/S/D to move across the grid.</div>
      </div>

      {activeItem ? (
        <article style={activeCardStyle}>
          <div style={activeCardHeaderStyle}>
            <div>
              <div style={metaStyle}>{activeItem.eyebrow ?? "Selected tile"}</div>
              <h3 style={activeCardTitleStyle}>{activeItem.label}</h3>
            </div>
            <div style={pillStyle}>{activeItem.meta ?? `Tile ${activeIndex + 1}`}</div>
          </div>
          <p style={activeCardDescriptionStyle}>{activeItem.description}</p>
        </article>
      ) : null}

      <div style={gridListStyle}>
        {layout.cells.map((cell) => {
          const item = items[cell.index];
          const isActive = cell.index === activeIndex;
          const isPlaceholder = !item;
          const accentColor = colorPalette[cell.index]?.getStyle() ?? FALLBACK_ACCENT_COLORS[0];

          return (
            <button
              key={`${cell.row}-${cell.column}`}
              type="button"
              disabled={isPlaceholder}
              onClick={() => selectIndex(cell.index)}
              style={{
                ...tileButtonStyle,
                background: isPlaceholder
                  ? "linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.35))"
                  : isActive
                    ? `linear-gradient(180deg, ${withAlpha(accentColor, 0.44)}, ${withAlpha(
                        accentColor,
                        0.18,
                      )})`
                    : `linear-gradient(180deg, ${withAlpha(accentColor, 0.22)}, rgba(15, 23, 42, 0.12))`,
                borderColor: isActive ? withAlpha(accentColor, 0.76) : "rgba(148, 163, 184, 0.24)",
                color: isPlaceholder ? "rgba(148, 163, 184, 0.55)" : "#e5eefb",
                cursor: isPlaceholder ? "not-allowed" : "pointer",
                opacity: isPlaceholder ? 0.6 : 1,
              }}
            >
              <span style={tileButtonMetaStyle}>{item?.eyebrow ?? "Empty"}</span>
              <span style={tileButtonTitleStyle}>{item?.label ?? "Reserved"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function getHexTileNavigationNeighborIndex(
  currentIndex: number,
  direction: HexTileNavigationDirection,
  itemCount: number,
  columns: number,
  rows = Math.max(1, Math.ceil(itemCount / columns)),
) {
  if (itemCount <= 0) {
    return -1;
  }

  assertPositiveInteger(columns, "columns");
  assertPositiveInteger(rows, "rows");

  if (currentIndex < 0 || currentIndex >= itemCount) {
    return 0;
  }

  let row = Math.floor(currentIndex / columns);
  let column = currentIndex % columns;
  const [rowDelta, columnDelta] = getHexTileNavigationDirectionDelta(direction, column);

  while (true) {
    row += rowDelta;
    column += columnDelta;

    if (row < 0 || row >= rows || column < 0 || column >= columns) {
      return currentIndex;
    }

    const nextIndex = row * columns + column;

    if (nextIndex < itemCount) {
      return nextIndex;
    }
  }
}

function getHexTileNavigationDirectionDelta(
  direction: HexTileNavigationDirection,
  column: number,
): readonly [number, number] {
  const parity = Math.abs(column % 2) as 0 | 1;
  const deltasByParity = [
    {
      left: [0, -1],
      right: [0, 1],
      up: [-1, 0],
      down: [1, 0],
      "up-left": [-1, -1],
      "up-right": [-1, 1],
      "down-left": [0, -1],
      "down-right": [0, 1],
    },
    {
      left: [0, -1],
      right: [0, 1],
      up: [-1, 0],
      down: [1, 0],
      "up-left": [0, -1],
      "up-right": [0, 1],
      "down-left": [1, -1],
      "down-right": [1, 1],
    },
  ] as const satisfies readonly Record<
    HexTileNavigationDirection,
    readonly [rowDelta: number, columnDelta: number]
  >[];

  return deltasByParity[parity][direction];
}

function assertPositiveInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function withAlpha(color: string, alpha: number) {
  const resolvedColor = new Color(color);

  return `rgba(${Math.round(resolvedColor.r * 255)}, ${Math.round(resolvedColor.g * 255)}, ${Math.round(
    resolvedColor.b * 255,
  )}, ${alpha})`;
}

const rootStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  width: "100%",
  maxWidth: "100%",
  padding: "1.25rem",
  borderRadius: "1.5rem",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  background:
    "linear-gradient(180deg, rgba(8, 15, 31, 0.94), rgba(11, 18, 32, 0.92)), radial-gradient(circle at top, rgba(56, 189, 248, 0.14), transparent 30%)",
  color: "#f8fafc",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
  outline: "none",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gap: "0.5rem",
};

const eyebrowStyle: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(148, 163, 184, 0.88)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
  lineHeight: 1.05,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "42rem",
  color: "rgba(226, 232, 240, 0.78)",
  lineHeight: 1.55,
};

const stageStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "1.25rem",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background:
    "radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 36%), linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(2, 6, 23, 0.98))",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  alignItems: "center",
};

const buttonStyle: CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(15, 23, 42, 0.75)",
  color: "#e2e8f0",
  padding: "0.75rem 1rem",
  borderRadius: "999px",
  fontWeight: 600,
};

const hintStyle: CSSProperties = {
  color: "rgba(148, 163, 184, 0.82)",
  fontSize: "0.95rem",
};

const activeCardStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  padding: "1rem 1.1rem",
  borderRadius: "1.1rem",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.46)",
};

const activeCardHeaderStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  justifyContent: "space-between",
  alignItems: "center",
};

const activeCardTitleStyle: CSSProperties = {
  margin: "0.15rem 0 0",
  fontSize: "1.2rem",
};

const activeCardDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "rgba(226, 232, 240, 0.82)",
  lineHeight: 1.55,
};

const metaStyle: CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(125, 211, 252, 0.9)",
};

const pillStyle: CSSProperties = {
  padding: "0.38rem 0.72rem",
  borderRadius: "999px",
  border: "1px solid rgba(125, 211, 252, 0.22)",
  color: "rgba(191, 219, 254, 0.95)",
  background: "rgba(30, 41, 59, 0.7)",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const gridListStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
};

const tileButtonStyle: CSSProperties = {
  appearance: "none",
  display: "grid",
  gap: "0.35rem",
  minHeight: "5.5rem",
  padding: "0.95rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  textAlign: "left",
};

const tileButtonMetaStyle: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const tileButtonTitleStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  lineHeight: 1.35,
};
