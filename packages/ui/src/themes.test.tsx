import { existsSync, readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  AnnotationCanvas,
  type AnnotationCanvasAnnotation,
  type AnnotationCanvasTool,
  AssetBrowser,
  type AssetBrowserItem,
  Button,
  ButtonGroup,
  ButtonGroupText,
  Calendar,
  CalendarCardDayButton,
  CalendarDayButton,
  type CalendarCellComponentProps,
  type CalendarDayComponentProps,
  type CalendarIcsData,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chat,
  ChatBubble,
  ChatComposer,
  ChatComposerInput,
  ChatHeader,
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
  ChatMessageMeta,
  ChatSendButton,
  ChatThread,
  ChatTitle,
  ActionBar,
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
  CommandShortcut,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
  cn,
  CopyButton,
  DataGrid,
  DataGridColumnHeader,
  DescriptionList,
  DescriptionListDetail,
  DescriptionListItem,
  DescriptionListTerm,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DocumentViewer,
  type DocumentViewerHighlight,
  type DocumentViewerPageData,
  DotsSpinner,
  Dropzone,
  DropzoneContent,
  DropzoneDefaultIcon,
  DropzoneDescription,
  DropzoneIcon,
  DropzoneInput,
  DropzoneTitle,
  DropdownMenuShortcut,
  Empty,
  EmptyDescription,
  EmptyTitle,
  InspectorPanel,
  type InspectorPanelSectionData,
  Kbd,
  LoadingBar,
  MenubarShortcut,
  MobileSlide,
  MobileSlideBody,
  MobileSlideClose,
  MobileSlideContent,
  MobileSlideDescription,
  MobileSlideFooter,
  MobileSlideHeader,
  MobileSlideTitle,
  MobileSlideTrigger,
  PlatformNavbar,
  type PlatformNavbarGroup,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageShell,
  PageTitle,
  QueryBuilder,
  evaluateQueryBuilderExpression,
  serializeQueryBuilderExpression,
  type QueryBuilderExpression,
  type QueryBuilderField,
  SectionGrid,
  Spinner,
  PulseSpinner,
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
  Stepper,
  StepperConnector,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceHeader,
  SurfaceTitle,
  Switch,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineEditor,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
  WorkflowBuilder,
  getWorkflowBuilderConnectionValidity,
  type WorkflowBuilderEdge,
  type WorkflowBuilderNodeData,
  moveTimelineEditorClip,
  resizeTimelineEditorClip,
  type TimelineEditorTrack,
  Toggle,
  ToggleSetting,
  Toolbar,
  ToolbarGroup,
  ToolbarSpacer,
  ToolbarTitle,
  UiTheme,
  createUiTheme,
  defaultUiThemeName,
  themeConfig,
  uiThemeLabels,
  uiThemeNames,
  uiTokenNames,
  type UiThemeName,
} from ".";
import { AtlasTheme, atlasTheme, uiTheme as atlasUiTheme } from "./atlas";
import { BobbaTheme, Button as BobbaButton, bobbaTheme, uiTheme as bobbaUiTheme } from "./bobba";
import { PaperTheme, paperTheme, uiTheme as paperUiTheme } from "./paper";
import { StudioTheme, studioTheme, uiTheme as studioUiTheme } from "./studio";
import { Button as ZleekButton, ZleekTheme, uiTheme as zleekUiTheme, zleekTheme } from "./zleek";

const shadcnBasicComponentFiles = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "data-table",
  "date-picker",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "loading-bar",
  "menubar",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "typography",
] as const;

const calendarIcsData = [
  "vcalendar",
  [
    ["version", {}, "text", "2.0"],
    ["prodid", {}, "text", "-//platform-packages//Calendar Test//EN"],
  ],
  [
    [
      "vevent",
      [
        ["uid", {}, "text", "design-sync"],
        ["summary", {}, "text", "Design sync"],
        ["dtstart", {}, "date-time", "2026-04-15T09:00:00Z"],
        ["dtend", {}, "date-time", "2026-04-15T09:30:00Z"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "release-window"],
        ["summary", {}, "text", "Release window"],
        ["dtstart", {}, "date", "2026-04-18"],
        ["dtend", {}, "date", "2026-04-20"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "product-summit"],
        ["summary", {}, "text", "Product summit"],
        ["dtstart", {}, "date", "2026-04-21"],
        ["dtend", {}, "date", "2026-04-24"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "company-holiday"],
        ["summary", {}, "text", "Company holiday"],
        ["dtstart", {}, "date", "2026-04-27"],
        ["dtend", {}, "date", "2026-04-28"],
      ],
      [],
    ],
  ],
] as const satisfies CalendarIcsData;

const navigationGroups = [
  {
    id: "discover",
    label: "Discover",
    eyebrow: "Public",
    description: "Open routes for visitors.",
    items: [
      {
        id: "about",
        label: "About",
        href: "#about",
        description: "Project overview and status.",
      },
      {
        id: "story",
        label: "Story Demo",
        href: "#story",
        description: "Narrative component preview.",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "people",
        label: "People",
        href: "#people",
        description: "Directory and profiles.",
      },
      {
        id: "forms",
        label: "Forms",
        href: "#forms",
      },
    ],
  },
] as const satisfies PlatformNavbarGroup[];

function createRect({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

describe("@moritzbrantner/ui theme-contract", () => {
  test("exports design-system component entrypoints", () => {
    const allThemeNames = [
      "zleek",
      "bobba",
      "atlas",
      "studio",
      "paper",
      "custom",
    ] as const satisfies readonly UiThemeName[];

    render(
      <>
        <ZleekTheme>
          <ZleekButton>Zleek action</ZleekButton>
        </ZleekTheme>
        <BobbaTheme>
          <BobbaButton>Bobba action</BobbaButton>
        </BobbaTheme>
        <AtlasTheme>
          <Button>Atlas action</Button>
        </AtlasTheme>
        <StudioTheme>
          <Button>Studio action</Button>
        </StudioTheme>
        <PaperTheme>
          <Button>Paper action</Button>
        </PaperTheme>
      </>,
    );

    expect(screen.getByRole("button", { name: "Zleek action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bobba action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Atlas action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Studio action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paper action" })).toBeTruthy();
    expect(Object.keys(themeConfig).sort()).toEqual([...allThemeNames].sort());
    expect(uiThemeNames).toEqual(["bobba", "zleek", "atlas", "studio", "paper", "custom"]);
    expect(defaultUiThemeName).toBe("bobba");
    expect(uiThemeLabels.paper).toBe("Paper");
    expect(uiThemeLabels.custom).toBe("Custom");
    expect(zleekTheme.name).toBe("zleek");
    expect(bobbaTheme.name).toBe("bobba");
    expect(atlasTheme.name).toBe("atlas");
    expect(studioTheme.name).toBe("studio");
    expect(paperTheme.name).toBe("paper");
    expect(zleekUiTheme).toBe(zleekTheme);
    expect(bobbaUiTheme).toBe(bobbaTheme);
    expect(atlasUiTheme).toBe(atlasTheme);
    expect(studioUiTheme).toBe(studioTheme);
    expect(paperUiTheme).toBe(paperTheme);
  });

  test("creates sanitized custom theme token styles", () => {
    const style = createUiTheme({
      "--primary": "oklch(0.58 0.17 250)",
      "--ui-radius-control": "0.75rem",
      "--ui-control-height-md": "2.5rem",
      "--unknown-token": "red",
    } as Parameters<typeof createUiTheme>[0]);

    render(
      <UiTheme theme="custom" style={style} data-testid="custom-theme">
        <Button>Custom action</Button>
      </UiTheme>,
    );

    const root = screen.getByTestId("custom-theme");

    expect(uiTokenNames).toContain("--ui-radius-control");
    expect(root.getAttribute("data-ui-theme")).toBe("custom");
    expect(root.className).toContain("custom");
    expect(root.getAttribute("style")).toContain("--primary: oklch(0.58 0.17 250)");
    expect(root.getAttribute("style")).toContain("--ui-radius-control: 0.75rem");
    expect(root.getAttribute("style")).not.toContain("--unknown-token");
  });
});
