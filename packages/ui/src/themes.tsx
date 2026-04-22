"use client";

import * as React from "react";

import { cn } from "./lib/cn";

const uiThemeNames = ["bobba", "zleek", "atlas", "studio", "paper"] as const;

type UiThemeName = (typeof uiThemeNames)[number];

const defaultUiThemeName = "bobba" as const satisfies UiThemeName;

const uiThemeLabels = {
  bobba: "Bobba",
  zleek: "Zleek",
  atlas: "Atlas",
  studio: "Studio",
  paper: "Paper",
} as const satisfies Record<UiThemeName, string>;

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

const atlasTheme = {
  name: "atlas",
  className: "atlas",
  dataAttribute: { "data-ui-theme": "atlas" },
} as const satisfies UiThemeConfig;

const studioTheme = {
  name: "studio",
  className: "studio",
  dataAttribute: { "data-ui-theme": "studio" },
} as const satisfies UiThemeConfig;

const paperTheme = {
  name: "paper",
  className: "paper",
  dataAttribute: { "data-ui-theme": "paper" },
} as const satisfies UiThemeConfig;

const themeConfig = {
  zleek: zleekTheme,
  bobba: bobbaTheme,
  atlas: atlasTheme,
  studio: studioTheme,
  paper: paperTheme,
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

function AtlasTheme(props: Omit<UiThemeProps, "theme">) {
  return <UiTheme theme="atlas" {...props} />;
}

function StudioTheme(props: Omit<UiThemeProps, "theme">) {
  return <UiTheme theme="studio" {...props} />;
}

function PaperTheme(props: Omit<UiThemeProps, "theme">) {
  return <UiTheme theme="paper" {...props} />;
}

export {
  AtlasTheme,
  BobbaTheme,
  PaperTheme,
  StudioTheme,
  UiTheme,
  ZleekTheme,
  atlasTheme,
  bobbaTheme,
  defaultUiThemeName,
  paperTheme,
  studioTheme,
  themeConfig,
  uiThemeLabels,
  uiThemeNames,
  zleekTheme,
};
export type { UiThemeConfig, UiThemeName, UiThemeProps };
