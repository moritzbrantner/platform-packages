"use client";

import { paperTheme } from "./themes";

export * from "./index";
export { PaperTheme, UiTheme, paperTheme, themeConfig } from "./themes";
export type { UiThemeConfig, UiThemeName, UiThemeProps } from "./themes";

const uiTheme = paperTheme;

export { uiTheme };
