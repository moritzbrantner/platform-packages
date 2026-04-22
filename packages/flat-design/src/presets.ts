import {
  createFlatBadgeFigure,
  createFlatCardFigure,
  createFlatCloudFigure,
  createFlatSparkleFigure,
  createFlatSunFigure,
} from "./figures";
import { createFlatDesignPalette } from "./palette";
import type { FlatColorPalette, FlatDesignScene, FlatShape } from "./scene-types";

export type FlatShowcaseSceneOptions = {
  width?: number;
  height?: number;
  animate?: boolean;
  title?: string;
  description?: string;
  palette?: Partial<FlatColorPalette>;
};

export function createFlatShowcaseScene(options: FlatShowcaseSceneOptions = {}): FlatDesignScene {
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
          createFlatSunFigure({
            x: 644,
            y: 116,
            color: palette.accent,
            haloColor: palette.accent,
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 1,
                    to: 1.06,
                    minOpacity: 0.78,
                    maxOpacity: 1,
                    dur: "7s",
                  },
                }
              : false,
          }),
          createFlatCloudFigure({
            x: 180,
            y: 98,
            scale: 1,
            opacity: 0.92,
            motion: animate ? { preset: "drift", options: { distance: 20, dur: "11s" } } : false,
          }),
          createFlatCloudFigure({
            x: 500,
            y: 76,
            scale: 0.82,
            opacity: 0.92,
            motion: animate ? { preset: "drift", options: { distance: 20, dur: "11s" } } : false,
          }),
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
          createFlatBadgeFigure({
            x: 620,
            y: 186,
            color: palette.accentAlt,
            highlight: palette.highlight,
            checkColor: palette.accentAlt,
            motion: animate ? { preset: "bobbing", options: { distance: 14, dur: "4.2s" } } : false,
          }),
          createFlatCardFigure({
            x: 191,
            y: 191,
            surface: palette.highlight,
            detail: palette.surfaceAlt,
            accent: palette.accent,
            motion: animate ? { preset: "bobbing", options: { distance: 10, dur: "4.8s" } } : false,
          }),
        ],
      },
      {
        id: "sparkles",
        shapes: [
          createFlatSparkleFigure({
            x: 138,
            y: 126,
            color: palette.accentAlt,
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 0.92,
                    to: 1.12,
                    minOpacity: 0.45,
                    maxOpacity: 1,
                    dur: "5s",
                  },
                }
              : false,
          }),
          createFlatSparkleFigure({
            x: 722,
            y: 202,
            color: palette.highlight,
            motion: animate
              ? {
                  preset: "pulse",
                  options: {
                    from: 0.92,
                    to: 1.12,
                    minOpacity: 0.45,
                    maxOpacity: 1,
                    dur: "5s",
                  },
                }
              : false,
          }),
        ],
      },
    ],
  };
}
