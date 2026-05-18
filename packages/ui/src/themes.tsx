"use client";

import * as React from "react";

import { cn } from "./lib/cn";

const builtInUiThemeNames = ["bobba", "zleek", "atlas", "studio", "paper"] as const;
const uiThemeNames = [...builtInUiThemeNames, "custom"] as const;

type UiThemeName = (typeof uiThemeNames)[number];
type BuiltInUiThemeName = (typeof builtInUiThemeNames)[number];

const defaultUiThemeName = "bobba" as const satisfies BuiltInUiThemeName;

const uiThemeLabels = {
  bobba: "Bobba",
  zleek: "Zleek",
  atlas: "Atlas",
  studio: "Studio",
  paper: "Paper",
  custom: "Custom",
} as const satisfies Record<UiThemeName, string>;

const uiTokenNames = [
  "--font-sans-app",
  "--font-mono-app",
  "--radius",
  "--glass-shadow",
  "--glass-interactive-shadow",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--ui-radius-control",
  "--ui-radius-surface",
  "--ui-radius-overlay",
  "--ui-control-height-xs",
  "--ui-control-height-sm",
  "--ui-control-height-md",
  "--ui-control-height-lg",
  "--ui-control-padding-x-sm",
  "--ui-control-padding-x-md",
  "--ui-control-gap",
  "--ui-surface-padding-sm",
  "--ui-surface-padding-md",
  "--ui-surface-gap",
  "--ui-focus-ring-width",
  "--ui-motion-hover-y",
  "--ui-motion-hover-scale",
  "--ui-shadow-surface",
  "--ui-shadow-interactive",
  "--ui-button-height-xs",
  "--ui-button-height-sm",
  "--ui-button-height-md",
  "--ui-button-height-lg",
  "--ui-button-padding-x-xs",
  "--ui-button-padding-x-sm",
  "--ui-button-padding-x-md",
  "--ui-button-padding-x-lg",
  "--ui-button-radius",
  "--ui-input-height",
  "--ui-input-padding-x",
  "--ui-input-radius",
  "--ui-card-padding",
  "--ui-card-gap",
  "--ui-card-radius",
  "--ui-overlay-padding",
  "--ui-overlay-gap",
  "--ui-overlay-radius",
  "--ui-menu-padding",
  "--ui-menu-item-padding-x",
  "--ui-menu-item-padding-y",
  "--ui-menu-item-radius",
  "--ui-toolbar-padding-x",
  "--ui-toolbar-padding-y",
  "--ui-toolbar-gap",
  "--ui-toolbar-min-height",
  "--ui-tabs-list-padding",
  "--ui-tabs-trigger-padding-x",
  "--ui-tabs-radius",
] as const;

type UiTokenName = (typeof uiTokenNames)[number];
type UiThemeTokens = Partial<Record<UiTokenName, string>>;

const uiTokenNameSet = new Set<string>(uiTokenNames);

type UiThemeConfig = {
  name: UiThemeName;
  className: string;
  dataAttribute: {
    "data-ui-theme": UiThemeName;
  };
};

type UiThemeProps = React.ComponentProps<"div"> & {
  /**
   * Selects package theme metadata for this wrapper. Use theme-scopes.css when
   * multiple built-in themes need to coexist in the same document.
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

const customTheme = {
  name: "custom",
  className: "custom",
  dataAttribute: { "data-ui-theme": "custom" },
} as const satisfies UiThemeConfig;

const themeConfig = {
  zleek: zleekTheme,
  bobba: bobbaTheme,
  atlas: atlasTheme,
  studio: studioTheme,
  paper: paperTheme,
  custom: customTheme,
} as const satisfies Record<UiThemeName, UiThemeConfig>;

function createUiTheme(tokens: UiThemeTokens): React.CSSProperties {
  const style: Record<string, string> = {};

  for (const [tokenName, value] of Object.entries(tokens)) {
    if (uiTokenNameSet.has(tokenName) && typeof value === "string") {
      style[tokenName] = value;
    }
  }

  return style as React.CSSProperties;
}

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
  builtInUiThemeNames,
  createUiTheme,
  customTheme,
  defaultUiThemeName,
  paperTheme,
  studioTheme,
  themeConfig,
  uiThemeLabels,
  uiThemeNames,
  uiTokenNames,
  zleekTheme,
};
export type {
  BuiltInUiThemeName,
  UiThemeConfig,
  UiThemeName,
  UiThemeProps,
  UiThemeTokens,
  UiTokenName,
};
