"use client";

import { studioTheme } from "./themes";

export * from "./index";
export { StudioTheme, UiTheme, studioTheme, themeConfig } from "./themes";
export type { UiThemeConfig, UiThemeName, UiThemeProps } from "./themes";

const uiTheme = studioTheme;

export { uiTheme };
