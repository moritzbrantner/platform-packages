import React from "react";
import type { Preview } from "@storybook/react-vite";

import { defaultUiThemeName, uiThemeLabels, uiThemeNames, type UiThemeName } from "../src/themes";
import atlasStyles from "../atlas/styles.css?inline";
import bobbaStyles from "../bobba/styles.css?inline";
import paperStyles from "../paper/styles.css?inline";
import studioStyles from "../studio/styles.css?inline";
import zleekStyles from "../zleek/styles.css?inline";

const designSystemStyles = {
  bobba: bobbaStyles,
  zleek: zleekStyles,
  atlas: atlasStyles,
  studio: studioStyles,
  paper: paperStyles,
} as const satisfies Record<UiThemeName, string>;

const designSystemOptions = uiThemeNames.map((value) => ({
  value,
  title: uiThemeLabels[value],
}));

function isDesignSystemName(value: unknown): value is UiThemeName {
  return typeof value === "string" && value in designSystemStyles;
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

  if (styleElement.textContent !== designSystemStyles[theme]) {
    styleElement.textContent = designSystemStyles[theme];
  }

  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.dataset.uiDesignSystem = theme;
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
