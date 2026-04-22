import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  FoundationAppShell,
  FoundationProvider,
  createMemoryFoundationBackend,
  type FoundationPlatform,
  type FoundationRouteId,
} from "@moritzbrantner/foundation-ui";
import { UiTheme, defaultUiThemeName, uiThemeLabels, type UiThemeName } from "@moritzbrantner/ui";

type FoundationStoryProps = {
  initialRoute?: FoundationRouteId;
  platform?: FoundationPlatform;
};

const meta = {
  title: "Foundation UI/Workflows",
  tags: ["autodocs", "test"],
  args: {
    initialRoute: "profile",
    platform: "web",
  },
  argTypes: {
    initialRoute: {
      control: "select",
      options: [
        "auth",
        "profile",
        "people",
        "notifications",
        "settings",
        "report-problem",
        "data-entry",
        "uploads",
      ],
    },
    platform: {
      control: "select",
      options: ["web", "electron", "tauri"],
    },
  },
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
} satisfies Meta<FoundationStoryProps>;

export default meta;

type Story = StoryObj<typeof meta>;

function resolveDesignSystem(value: unknown): UiThemeName {
  if (typeof value === "string" && value in uiThemeLabels) {
    return value as UiThemeName;
  }

  return defaultUiThemeName;
}

const renderFoundationStory: Story["render"] = (args, context) => (
  <FoundationStoryFrame
    {...args}
    designSystem={resolveDesignSystem(context.globals.designSystem)}
  />
);

export const AppShell: Story = {
  render: renderFoundationStory,
};

export const Auth: Story = {
  args: { initialRoute: "auth" },
  render: renderFoundationStory,
};

export const People: Story = {
  args: { initialRoute: "people" },
  render: renderFoundationStory,
};

export const Notifications: Story = {
  args: { initialRoute: "notifications" },
  render: renderFoundationStory,
};

export const Settings: Story = {
  args: { initialRoute: "settings" },
  render: renderFoundationStory,
};

export const ReportProblem: Story = {
  args: { initialRoute: "report-problem" },
  render: renderFoundationStory,
};

export const DataEntry: Story = {
  args: { initialRoute: "data-entry" },
  render: renderFoundationStory,
};

export const Uploads: Story = {
  args: { initialRoute: "uploads" },
  render: renderFoundationStory,
};

export const Bobba: Story = {
  globals: { designSystem: "bobba" },
  render: renderFoundationStory,
};

export const Zleek: Story = {
  globals: { designSystem: "zleek" },
  render: renderFoundationStory,
};

export const Atlas: Story = {
  globals: { designSystem: "atlas" },
  render: renderFoundationStory,
};

export const Studio: Story = {
  globals: { designSystem: "studio" },
  render: renderFoundationStory,
};

export const Paper: Story = {
  globals: { designSystem: "paper" },
  render: renderFoundationStory,
};

function FoundationStoryFrame({
  initialRoute = "profile",
  platform = "web",
  designSystem,
}: FoundationStoryProps & { designSystem: UiThemeName }) {
  const [activeRoute, setActiveRoute] = React.useState(initialRoute);
  const [backend] = React.useState(() => createMemoryFoundationBackend({ role: "ADMIN" }));

  React.useEffect(() => {
    setActiveRoute(initialRoute);
  }, [initialRoute]);

  const runtime = React.useMemo(
    () => ({
      platform,
      locale: "en-US",
      navigate: setActiveRoute,
      backend,
      labels: {
        appName: "Platform",
      },
    }),
    [backend, platform],
  );

  return (
    <UiTheme theme={designSystem} className="block min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto w-full max-w-7xl">
        <FoundationProvider runtime={runtime}>
          <FoundationAppShell activeRouteId={activeRoute} />
        </FoundationProvider>
      </div>
    </UiTheme>
  );
}
