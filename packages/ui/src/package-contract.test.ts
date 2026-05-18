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
  CommandPalette,
  CommandShortcut,
  type CommandPaletteGroup,
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
  EmptyState,
  ErrorState,
  InspectorPanel,
  type InspectorPanelSectionData,
  Kbd,
  LanguageSwitcher,
  type LanguageSwitcherLanguage,
  LoadingBar,
  LoadingState,
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
  SearchField,
  SelectionToolbar,
  ShortcutList,
  Spinner,
  PulseSpinner,
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
  StateView,
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
  ThemeModeSwitch,
  type ThemeMode,
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
  UploadQueue,
  ValidationSummary,
  WorkbenchLayout,
  defaultUiThemeName,
  themeConfig,
  uiThemeLabels,
  uiThemeNames,
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

describe("@moritzbrantner/ui package-contract", () => {
  test("declares the reusable design-system package contract", () => {
    const packageJson = JSON.parse(readFileSync("packages/ui/package.json", "utf8"));
    const consumerExample = readFileSync("packages/ui/examples/consumer/src/App.tsx", "utf8");

    expect(packageJson.name).toBe("@moritzbrantner/ui");
    expect(packageJson.private).toBe(false);
    expect(packageJson.peerDependencies.react).toBeTruthy();
    expect(packageJson.peerDependencies["react-dom"]).toBeTruthy();
    expect(packageJson.files).toEqual(
      expect.arrayContaining([
        "dist",
        "styles.css",
        "theme-scopes.css",
        "zleek",
        "bobba",
        "atlas",
        "studio",
        "paper",
      ]),
    );
    expect(packageJson.sideEffects).toEqual(expect.arrayContaining(["*.css"]));
    expect(packageJson.exports["./styles.css"]).toBe("./styles.css");
    expect(packageJson.exports["./theme-scopes.css"]).toBe("./theme-scopes.css");
    expect(packageJson.exports["./zleek/styles.css"]).toBe("./zleek/styles.css");
    expect(packageJson.exports["./bobba/styles.css"]).toBe("./bobba/styles.css");
    expect(packageJson.exports["./atlas"].import).toBe("./dist/atlas.js");
    expect(packageJson.exports["./studio"].import).toBe("./dist/studio.js");
    expect(packageJson.exports["./paper"].import).toBe("./dist/paper.js");
    expect(packageJson.exports["./atlas/styles.css"]).toBe("./atlas/styles.css");
    expect(packageJson.exports["./studio/styles.css"]).toBe("./studio/styles.css");
    expect(packageJson.exports["./paper/styles.css"]).toBe("./paper/styles.css");
    expect(packageJson.exports["./components/*"].import).toBe("./dist/components/*.js");
    expect(packageJson.exports["./lib/cn"].import).toBe("./dist/lib/cn.js");
    expect(consumerExample).toContain('import "@moritzbrantner/ui/styles.css";');
    expect(consumerExample).toContain('from "@moritzbrantner/ui"');
  });

  test("ships the full shadcn basic component catalog", () => {
    const indexSource = readFileSync("packages/ui/src/index.ts", "utf8");

    for (const componentFile of shadcnBasicComponentFiles) {
      expect(existsSync(`packages/ui/src/components/${componentFile}.tsx`)).toBe(true);
      expect(indexSource).toContain(`export * from "./components/${componentFile}";`);
    }
  });

  test("merges class names", () => {
    expect(cn("px-4", "px-2", "font-semibold")).toBe("px-2 font-semibold");
  });
});
