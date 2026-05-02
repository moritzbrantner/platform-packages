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
  defaultUiThemeName,
  themeConfig,
  uiThemeLabels,
  uiThemeNames,
  type UiThemeName,
} from "@moritzbrantner/ui";
import { AtlasTheme, atlasTheme, uiTheme as atlasUiTheme } from "@moritzbrantner/ui/atlas";
import {
  BobbaTheme,
  Button as BobbaButton,
  bobbaTheme,
  uiTheme as bobbaUiTheme,
} from "@moritzbrantner/ui/bobba";
import { PaperTheme, paperTheme, uiTheme as paperUiTheme } from "@moritzbrantner/ui/paper";
import { StudioTheme, studioTheme, uiTheme as studioUiTheme } from "@moritzbrantner/ui/studio";
import {
  Button as ZleekButton,
  ZleekTheme,
  uiTheme as zleekUiTheme,
  zleekTheme,
} from "@moritzbrantner/ui/zleek";

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

describe("@moritzbrantner/ui document-workflows", () => {
  test("renders AssetBrowser grid/list selection, search, upload, preview, and open callbacks", () => {
    const items: AssetBrowserItem[] = [
      { id: "folder", name: "Projects", type: "folder" },
      { id: "hero", name: "hero.jpg", type: "image", size: 2048, description: "Hero visual" },
      { id: "brief", name: "brief.pdf", type: "document", size: 1024 },
    ];
    const onSelectionChange = vi.fn();
    const onOpenItem = vi.fn();
    const onUpload = vi.fn();
    const { rerender } = render(
      <AssetBrowser
        items={items}
        onSelectionChange={onSelectionChange}
        onOpenItem={onOpenItem}
        onUpload={onUpload}
      />,
    );

    expect(screen.getByText("Projects")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "hero" } });
    expect(screen.getByText("hero.jpg")).toBeTruthy();
    expect(screen.queryByText("brief.pdf")).toBeNull();

    const heroButton = screen.getByText("hero.jpg").closest("button")!;
    fireEvent.click(heroButton);
    expect(onSelectionChange).toHaveBeenCalledWith(
      ["hero"],
      [expect.objectContaining({ id: "hero" })],
    );
    expect(screen.getByText("Hero visual")).toBeTruthy();

    fireEvent.doubleClick(heroButton);
    expect(onOpenItem).toHaveBeenCalledWith(expect.objectContaining({ id: "hero" }));

    const file = new File(["file"], "upload.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Upload files"), { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith([file]);

    rerender(
      <AssetBrowser
        key="list"
        items={items}
        defaultView="list"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getByText("Projects").closest("button")!);
    fireEvent.click(screen.getByText("hero.jpg").closest("button")!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      ["folder", "hero"],
      expect.arrayContaining([
        expect.objectContaining({ id: "folder" }),
        expect.objectContaining({ id: "hero" }),
      ]),
    );
  });

  test("renders DocumentViewer pages, search, zoom, highlights, and states", () => {
    const pages: DocumentViewerPageData[] = [
      {
        id: "page-1",
        pageNumber: 1,
        width: 300,
        height: 420,
        text: "Revenue report and OCR summary.",
      },
      {
        id: "page-2",
        pageNumber: 2,
        width: 300,
        height: 420,
        text: "Invoice exception requires review.",
      },
    ];
    const highlights: DocumentViewerHighlight[] = [
      {
        id: "revenue",
        pageId: "page-1",
        label: "Revenue highlight",
        rects: [{ x: 0.1, y: 0.1, width: 0.3, height: 0.08 }],
      },
    ];
    const onPageChange = vi.fn();
    const onZoomChange = vi.fn();
    const onHighlightSelect = vi.fn();
    const { rerender } = render(
      <DocumentViewer
        pages={pages}
        highlights={highlights}
        onPageChange={onPageChange}
        onZoomChange={onZoomChange}
        onHighlightSelect={onHighlightSelect}
      />,
    );

    expect(screen.getByText("Revenue report and OCR summary.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(expect.objectContaining({ id: "page-2" }));

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(1.1);

    fireEvent.change(screen.getByLabelText("Search document"), { target: { value: "invoice" } });
    expect(screen.getByText("1 matches")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(expect.objectContaining({ id: "page-2" }));

    fireEvent.click(screen.getByRole("button", { name: "Thumbnail page 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Revenue highlight" }));
    expect(onHighlightSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "revenue" }));

    rerender(<DocumentViewer loading />);
    expect(screen.getByRole("status").textContent).toContain("Loading document");
    rerender(<DocumentViewer error="Failed to load document" />);
    expect(screen.getByRole("alert").textContent).toContain("Failed to load document");
    rerender(<DocumentViewer pages={[]} />);
    expect(screen.getByText("No document pages available.")).toBeTruthy();
  });

  test("renders QueryBuilder interactions and evaluates serializable expressions", () => {
    const fields: QueryBuilderField[] = [
      { id: "name", label: "Name", type: "text" },
      { id: "rows", label: "Rows", type: "number" },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Ready", value: "ready" },
          { label: "Blocked", value: "blocked" },
        ],
      },
    ];
    const expression: QueryBuilderExpression = {
      id: "root",
      combinator: "and",
      rules: [{ id: "rule-1", fieldId: "name", operator: "contains", value: "alpha" }],
    };
    const onExpressionChange = vi.fn();

    function Harness() {
      const [currentExpression, setCurrentExpression] = React.useState(expression);

      return (
        <QueryBuilder
          fields={fields}
          expression={currentExpression}
          onExpressionChange={(nextExpression) => {
            setCurrentExpression(nextExpression);
            onExpressionChange(nextExpression);
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onExpressionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rules: expect.arrayContaining([expect.objectContaining({ fieldId: "name" })]),
      }),
    );

    fireEvent.change(screen.getAllByLabelText("Rule field")[0], { target: { value: "rows" } });
    fireEvent.change(screen.getAllByLabelText("Rule operator")[0], { target: { value: "gt" } });
    fireEvent.change(screen.getAllByLabelText("Rule value")[0], { target: { value: "1000" } });
    expect(onExpressionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rules: expect.arrayContaining([expect.objectContaining({ value: 1000 })]),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add group" }));
    expect(onExpressionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rules: expect.arrayContaining([expect.objectContaining({ combinator: "and" })]),
      }),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Remove rule" })[0]);
    expect(onExpressionChange).toHaveBeenCalled();

    const filterExpression: QueryBuilderExpression = {
      id: "filter",
      combinator: "and",
      rules: [{ id: "rows", fieldId: "rows", operator: "gte", value: 1000 }],
    };
    expect(serializeQueryBuilderExpression(filterExpression)).toContain('"combinator":"and"');
    expect(evaluateQueryBuilderExpression(filterExpression, { rows: 1200 }, fields)).toBe(true);
    expect(evaluateQueryBuilderExpression(filterExpression, { rows: 400 }, fields)).toBe(false);
  });

  test("renders InspectorPanel fields, dirty state, apply, reset, and validation", () => {
    const sections: InspectorPanelSectionData[] = [
      {
        id: "node",
        title: "Node",
        fields: [
          { id: "label", label: "Label", type: "text", value: "OCR" },
          {
            id: "status",
            label: "Status",
            type: "select",
            value: "running",
            options: [
              { label: "Running", value: "running" },
              { label: "Success", value: "success" },
            ],
          },
          { id: "enabled", label: "Enabled", type: "boolean", value: true },
          { id: "notes", label: "Notes", type: "textarea", value: "Extract text" },
        ],
      },
    ];
    const onValuesChange = vi.fn();
    const onApply = vi.fn();
    const onReset = vi.fn();
    render(
      <InspectorPanel
        title="OCR"
        sections={sections}
        validationMessages={{ label: "Label is required." }}
        onValuesChange={onValuesChange}
        onApply={onApply}
        onReset={onReset}
      />,
    );

    expect(screen.getByText("Node")).toBeTruthy();
    expect(screen.getByText("Label is required.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "OCR extract" } });
    expect(onValuesChange).toHaveBeenCalledWith(
      expect.objectContaining({ label: "OCR extract" }),
      true,
    );
    expect(screen.getByText("Unsaved")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "success" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply/ }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));

    fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(onReset).toHaveBeenCalled();
    expect((screen.getByLabelText("Label") as HTMLInputElement).value).toBe("OCR");
  });
});
