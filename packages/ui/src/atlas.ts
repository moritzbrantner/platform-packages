"use client";

import { atlasTheme } from "./themes";

export * from "./index";
export { AtlasTheme, UiTheme, atlasTheme, themeConfig } from "./themes";
export type { UiThemeConfig, UiThemeName, UiThemeProps } from "./themes";

const uiTheme = atlasTheme;

export { uiTheme };
