import type { FlatColorPalette } from "./scene-types";

export const defaultFlatDesignPalette: FlatColorPalette = {
  background: "#F4F7FF",
  surface: "#E1E9FF",
  surfaceAlt: "#BFCBFF",
  accent: "#FFB347",
  accentAlt: "#2D7FF9",
  detail: "#1B2559",
  shadow: "#7E8BCB",
  highlight: "#FFFFFF",
};

export function createFlatDesignPalette(
  overrides: Partial<FlatColorPalette> = {},
): FlatColorPalette {
  return {
    ...defaultFlatDesignPalette,
    ...overrides,
  };
}
