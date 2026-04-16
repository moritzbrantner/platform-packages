import {
  createBobbingAnimation,
  createDriftAnimation,
  createOpacityPulseAnimation,
  createPulseAnimation,
  createSpinAnimation,
} from "./animation-presets";
import { createFlatDesignPalette } from "./palette";
import type {
  FlatColorPalette,
  FlatDesignScene,
  FlatGroup,
  FlatShape,
} from "./scene-types";

export type FlatShowcaseSceneOptions = {
  width?: number;
  height?: number;
  animate?: boolean;
  title?: string;
  description?: string;
  palette?: Partial<FlatColorPalette>;
};

function createCloud(
  x: number,
  y: number,
  scale: number,
  animate: boolean,
): FlatGroup {
  return {
    kind: "group",
    opacity: 0.92,
    transform: `translate(${x} ${y}) scale(${scale})`,
    animations: animate ? [createDriftAnimation({ distance: 20, dur: "11s" })] : undefined,
    children: [
      { kind: "ellipse", cx: -26, cy: 3, rx: 28, ry: 18, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 2, cy: -8, rx: 34, ry: 24, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 34, cy: 5, rx: 24, ry: 16, fill: "#FFFFFF" },
      { kind: "rect", x: -40, y: 0, width: 88, height: 24, rx: 12, fill: "#FFFFFF" },
    ],
  };
}

function createSparkle(x: number, y: number, color: string, animate: boolean): FlatGroup {
  return {
    kind: "group",
    transform: `translate(${x} ${y})`,
    animations: animate
      ? [
          createPulseAnimation({ from: 0.92, to: 1.12, dur: "5s" }),
          createOpacityPulseAnimation({ minOpacity: 0.45, maxOpacity: 1, dur: "5s" }),
        ]
      : undefined,
    children: [
      {
        kind: "line",
        x1: 0,
        y1: -12,
        x2: 0,
        y2: 12,
        stroke: color,
        strokeWidth: 4,
        strokeLinecap: "round",
      },
      {
        kind: "line",
        x1: -12,
        y1: 0,
        x2: 12,
        y2: 0,
        stroke: color,
        strokeWidth: 4,
        strokeLinecap: "round",
      },
    ],
  };
}

function createBadge(color: string, highlight: string, animate: boolean): FlatGroup {
  return {
    kind: "group",
    transform: "translate(620 186)",
    animations: animate ? [createBobbingAnimation({ distance: 14, dur: "4.2s" })] : undefined,
    children: [
      { kind: "circle", cx: 0, cy: 0, r: 52, fill: color },
      { kind: "circle", cx: 0, cy: 0, r: 26, fill: highlight, opacity: 0.92 },
      {
        kind: "path",
        fill: color,
        d: "M-9 -1l8 8L16 -12l7 7L-1 20-16 5z",
        transform: "scale(0.8)",
      },
      createSparkle(-48, -40, highlight, animate),
      createSparkle(46, 36, highlight, animate),
    ],
  };
}

export function createFlatShowcaseScene(
  options: FlatShowcaseSceneOptions = {},
): FlatDesignScene {
  const {
    animate = true,
    description = "Animated flat-design hero scene with layered SVG shapes.",
    height = 480,
    palette: paletteOverrides,
    title = "Flat design showcase",
    width = 800,
  } = options;
  const palette = createFlatDesignPalette(paletteOverrides);

  const panelShapes: FlatShape[] = [
    {
      kind: "rect",
      x: 150,
      y: 182,
      width: 390,
      height: 194,
      rx: 32,
      fill: "url(#flat-panel-gradient)",
    },
    {
      kind: "rect",
      x: 150,
      y: 182,
      width: 390,
      height: 34,
      rx: 32,
      fill: palette.surface,
      opacity: 0.85,
    },
    { kind: "circle", cx: 180, cy: 199, r: 5, fill: palette.highlight, opacity: 0.85 },
    { kind: "circle", cx: 199, cy: 199, r: 5, fill: palette.highlight, opacity: 0.85 },
    { kind: "circle", cx: 218, cy: 199, r: 5, fill: palette.highlight, opacity: 0.85 },
    {
      kind: "rect",
      x: 188,
      y: 240,
      width: 154,
      height: 20,
      rx: 10,
      fill: palette.highlight,
      opacity: 0.95,
    },
    {
      kind: "rect",
      x: 188,
      y: 274,
      width: 214,
      height: 14,
      rx: 7,
      fill: palette.highlight,
      opacity: 0.7,
    },
    {
      kind: "rect",
      x: 188,
      y: 302,
      width: 178,
      height: 14,
      rx: 7,
      fill: palette.highlight,
      opacity: 0.7,
    },
    {
      kind: "rect",
      x: 188,
      y: 332,
      width: 108,
      height: 24,
      rx: 12,
      fill: palette.accent,
    },
    {
      kind: "rect",
      x: 426,
      y: 244,
      width: 76,
      height: 96,
      rx: 24,
      fill: palette.highlight,
      opacity: 0.92,
    },
    {
      kind: "rect",
      x: 446,
      y: 286,
      width: 14,
      height: 36,
      rx: 7,
      fill: palette.accentAlt,
    },
    {
      kind: "rect",
      x: 465,
      y: 268,
      width: 14,
      height: 54,
      rx: 7,
      fill: palette.accent,
    },
  ];

  return {
    width,
    height,
    title,
    description,
    background: palette.background,
    gradients: [
      {
        id: "flat-sky-gradient",
        kind: "linear",
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
        stops: [
          { offset: "0%", color: palette.surface },
          { offset: "100%", color: "#F9FBFF" },
        ],
      },
      {
        id: "flat-hill-gradient",
        kind: "linear",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
        stops: [
          { offset: "0%", color: palette.surfaceAlt },
          { offset: "100%", color: palette.accentAlt, opacity: 0.9 },
        ],
      },
      {
        id: "flat-panel-gradient",
        kind: "linear",
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
        stops: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "100%", color: "#E8EEFF" },
        ],
      },
    ],
    layers: [
      {
        id: "sky",
        shapes: [
          {
            kind: "rect",
            x: 0,
            y: 0,
            width,
            height,
            fill: "url(#flat-sky-gradient)",
          },
          {
            kind: "group",
            transform: "translate(644 116)",
            animations: animate
              ? [
                  createPulseAnimation({ from: 1, to: 1.06, dur: "7s" }),
                  createSpinAnimation({ angle: 360, dur: "26s" }),
                ]
              : undefined,
            children: [
              {
                kind: "circle",
                cx: 0,
                cy: 0,
                r: 62,
                fill: palette.accent,
                opacity: 0.18,
              },
              {
                kind: "circle",
                cx: 0,
                cy: 0,
                r: 42,
                fill: palette.accent,
              },
              {
                kind: "polygon",
                points: [
                  { x: 0, y: -78 },
                  { x: 8, y: -56 },
                  { x: -8, y: -56 },
                ],
                fill: palette.accent,
                opacity: 0.8,
              },
              {
                kind: "polygon",
                points: [
                  { x: 78, y: 0 },
                  { x: 56, y: 8 },
                  { x: 56, y: -8 },
                ],
                fill: palette.accent,
                opacity: 0.8,
              },
              {
                kind: "polygon",
                points: [
                  { x: 0, y: 78 },
                  { x: 8, y: 56 },
                  { x: -8, y: 56 },
                ],
                fill: palette.accent,
                opacity: 0.8,
              },
              {
                kind: "polygon",
                points: [
                  { x: -78, y: 0 },
                  { x: -56, y: 8 },
                  { x: -56, y: -8 },
                ],
                fill: palette.accent,
                opacity: 0.8,
              },
            ],
          },
          createCloud(180, 98, 1, animate),
          createCloud(500, 76, 0.82, animate),
        ],
      },
      {
        id: "ground",
        shapes: [
          {
            kind: "polygon",
            points: [
              { x: 0, y: 332 },
              { x: 126, y: 268 },
              { x: 268, y: 308 },
              { x: 410, y: 238 },
              { x: 600, y: 294 },
              { x: 800, y: 240 },
              { x: 800, y: 480 },
              { x: 0, y: 480 },
            ],
            fill: "url(#flat-hill-gradient)",
          },
          {
            kind: "polygon",
            points: [
              { x: 0, y: 372 },
              { x: 154, y: 334 },
              { x: 288, y: 356 },
              { x: 470, y: 314 },
              { x: 650, y: 364 },
              { x: 800, y: 332 },
              { x: 800, y: 480 },
              { x: 0, y: 480 },
            ],
            fill: palette.accentAlt,
            opacity: 0.96,
          },
          {
            kind: "ellipse",
            cx: 360,
            cy: 394,
            rx: 236,
            ry: 34,
            fill: palette.shadow,
            opacity: 0.18,
          },
        ],
      },
      {
        id: "panel",
        shapes: [
          ...panelShapes,
          createBadge(palette.accentAlt, palette.highlight, animate),
          {
            kind: "group",
            transform: "translate(132 154)",
            animations: animate
              ? [createBobbingAnimation({ distance: 10, dur: "4.8s" })]
              : undefined,
            children: [
              {
                kind: "rect",
                x: 0,
                y: 0,
                width: 118,
                height: 74,
                rx: 24,
                fill: palette.highlight,
                opacity: 0.96,
              },
              {
                kind: "rect",
                x: 18,
                y: 18,
                width: 82,
                height: 12,
                rx: 6,
                fill: palette.surfaceAlt,
              },
              {
                kind: "rect",
                x: 18,
                y: 40,
                width: 52,
                height: 16,
                rx: 8,
                fill: palette.accent,
              },
            ],
          },
        ],
      },
      {
        id: "sparkles",
        shapes: [
          createSparkle(138, 126, palette.accentAlt, animate),
          createSparkle(722, 202, palette.highlight, animate),
        ],
      },
    ],
  };
}
