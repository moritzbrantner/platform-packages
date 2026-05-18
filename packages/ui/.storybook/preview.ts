import React from "react";
import type { Preview } from "@storybook/react-vite";

import {
  defaultUiThemeName,
  uiThemeLabels,
  uiThemeNames,
  type BuiltInUiThemeName,
  type UiThemeName,
} from "../src/themes";
import atlasStyles from "../atlas/styles.css?inline";
import bobbaStyles from "../bobba/styles.css?inline";
import paperStyles from "../paper/styles.css?inline";
import studioStyles from "../studio/styles.css?inline";
import themeScopesStyles from "../theme-scopes.css?inline";
import zleekStyles from "../zleek/styles.css?inline";

const designSystemStyles = {
  bobba: bobbaStyles,
  zleek: zleekStyles,
  atlas: atlasStyles,
  studio: studioStyles,
  paper: paperStyles,
} as const satisfies Record<BuiltInUiThemeName, string>;

const designSystemOptions = uiThemeNames.map((value) => ({
  value,
  title: uiThemeLabels[value],
}));

function isDesignSystemName(value: unknown): value is UiThemeName {
  return typeof value === "string" && uiThemeNames.includes(value as UiThemeName);
}

function applyDesignSystemStyle(theme: UiThemeName) {
  if (typeof document === "undefined") {
    return;
  }

  const styleId = "moritzbrantner-ui-design-system";
  const styleElement =
    document.getElementById(styleId) ??
    Object.assign(document.createElement("style"), {
      id: styleId,
    });

  if (!styleElement.isConnected) {
    document.head.append(styleElement);
  }

  const nextStyles = theme === "custom" ? themeScopesStyles : designSystemStyles[theme];

  if (styleElement.textContent !== nextStyles) {
    styleElement.textContent = nextStyles;
  }

  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.dataset.uiDesignSystem = theme;
}

function applyThemeAdjustments({
  density,
  primaryColor,
  radius,
}: {
  density: "compact" | "default" | "comfortable";
  primaryColor: string;
  radius: "sharp" | "default" | "rounded";
}) {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const densityTokens = {
    compact: {
      "--ui-control-height-md": "2.125rem",
      "--ui-control-padding-x-md": "0.875rem",
      "--ui-surface-padding-md": "0.875rem",
      "--ui-surface-gap": "0.75rem",
    },
    default: {
      "--ui-control-height-md": "",
      "--ui-control-padding-x-md": "",
      "--ui-surface-padding-md": "",
      "--ui-surface-gap": "",
    },
    comfortable: {
      "--ui-control-height-md": "2.625rem",
      "--ui-control-padding-x-md": "1.125rem",
      "--ui-surface-padding-md": "1.25rem",
      "--ui-surface-gap": "1.125rem",
    },
  }[density];
  const radiusTokens = {
    sharp: {
      "--ui-radius-control": "0.125rem",
      "--ui-radius-surface": "0.25rem",
      "--ui-radius-overlay": "0.25rem",
    },
    default: {
      "--ui-radius-control": "",
      "--ui-radius-surface": "",
      "--ui-radius-overlay": "",
    },
    rounded: {
      "--ui-radius-control": "0.75rem",
      "--ui-radius-surface": "1rem",
      "--ui-radius-overlay": "1.25rem",
    },
  }[radius];

  for (const [tokenName, value] of Object.entries({ ...densityTokens, ...radiusTokens })) {
    rootStyle.setProperty(tokenName, value);
  }

  if (primaryColor) {
    rootStyle.setProperty("--primary", primaryColor);
  }
}

const preview: Preview = {
  globalTypes: {
    designSystem: {
      description: "Design system",
      defaultValue: defaultUiThemeName,
      toolbar: {
        icon: "paintbrush",
        items: designSystemOptions,
        dynamicTitle: true,
      },
    },
    density: {
      description: "UI density",
      defaultValue: "default",
      toolbar: {
        icon: "contrast",
        items: [
          { value: "compact", title: "Compact" },
          { value: "default", title: "Default" },
          { value: "comfortable", title: "Comfortable" },
        ],
        dynamicTitle: true,
      },
    },
    radius: {
      description: "UI radius",
      defaultValue: "default",
      toolbar: {
        icon: "circle",
        items: [
          { value: "sharp", title: "Sharp" },
          { value: "default", title: "Default" },
          { value: "rounded", title: "Rounded" },
        ],
        dynamicTitle: true,
      },
    },
    primaryColor: {
      description: "Primary color",
      defaultValue: "",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "", title: "Theme primary" },
          { value: "oklch(0.58 0.17 250)", title: "Blue" },
          { value: "oklch(0.62 0.16 150)", title: "Green" },
          { value: "oklch(0.6 0.19 25)", title: "Red" },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: "Color scheme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const selectedDesignSystem = isDesignSystemName(context.globals.designSystem)
        ? context.globals.designSystem
        : defaultUiThemeName;
      const theme = context.globals.theme === "dark" ? "dark" : "light";

      if (typeof document !== "undefined") {
        applyDesignSystemStyle(selectedDesignSystem);
        applyThemeAdjustments({
          density:
            context.globals.density === "compact" || context.globals.density === "comfortable"
              ? context.globals.density
              : "default",
          primaryColor:
            typeof context.globals.primaryColor === "string" ? context.globals.primaryColor : "",
          radius:
            context.globals.radius === "sharp" || context.globals.radius === "rounded"
              ? context.globals.radius
              : "default",
        });
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      }

      return React.createElement(
        "div",
        {
          "data-storybook-design-system": selectedDesignSystem,
          className: selectedDesignSystem,
        },
        React.createElement(Story),
      );
    },
  ],
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
