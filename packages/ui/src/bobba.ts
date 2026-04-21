"use client";

import { bobbaTheme } from "./themes";

export * from "./index";
export { BobbaTheme, UiTheme, bobbaTheme, themeConfig } from "./themes";
export type { UiThemeConfig, UiThemeName, UiThemeProps } from "./themes";

const uiTheme = bobbaTheme;

export { uiTheme };
