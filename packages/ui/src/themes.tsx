"use client";

import * as React from "react";

import { cn } from "./lib/cn";

type UiThemeName = "zleek" | "bobba";

type UiThemeConfig = {
  name: UiThemeName;
  className: string;
  dataAttribute: {
    "data-ui-theme": UiThemeName;
  };
};

type UiThemeProps = React.ComponentProps<"div"> & {
  /**
   * Selects package theme metadata for this wrapper. The actual design tokens
   * come from the globally imported UI stylesheet, so use one UI theme per app.
   */
  theme: UiThemeName;
};

const zleekTheme = {
  name: "zleek",
  className: "zleek",
  dataAttribute: { "data-ui-theme": "zleek" },
} as const satisfies UiThemeConfig;

const bobbaTheme = {
  name: "bobba",
  className: "bobba",
  dataAttribute: { "data-ui-theme": "bobba" },
} as const satisfies UiThemeConfig;

const themeConfig = {
  zleek: zleekTheme,
  bobba: bobbaTheme,
} as const satisfies Record<UiThemeName, UiThemeConfig>;

function UiTheme({ theme, className, ...props }: UiThemeProps) {
  const config = themeConfig[theme];

  return <div data-ui-theme={config.name} className={cn(config.className, className)} {...props} />;
}

function ZleekTheme(props: Omit<UiThemeProps, "theme">) {
  return <UiTheme theme="zleek" {...props} />;
}

function BobbaTheme(props: Omit<UiThemeProps, "theme">) {
  return <UiTheme theme="bobba" {...props} />;
}

export { BobbaTheme, UiTheme, ZleekTheme, bobbaTheme, themeConfig, zleekTheme };
export type { UiThemeConfig, UiThemeName, UiThemeProps };
