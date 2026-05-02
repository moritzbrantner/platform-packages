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

describe("@moritzbrantner/ui editor-workflows", () => {
  test("renders TimelineEditor and reports scrubbing, moving, resizing, nudge, and delete", () => {
    const tracks: TimelineEditorTrack[] = [
      {
        id: "main",
        label: "Main",
        clips: [{ id: "intro", label: "Intro", start: 1, end: 3, color: "#2563eb" }],
      },
    ];
    const onCurrentTimeChange = vi.fn();
    const onTracksChange = vi.fn();
    const onSelectedClipChange = vi.fn();
    const onClipDelete = vi.fn();
    const moved = moveTimelineEditorClip(tracks, "intro", 2, { duration: 10, snapInterval: 1 });
    const resized = resizeTimelineEditorClip(tracks, "intro", "end", 4, {
      duration: 10,
      snapInterval: 1,
    });

    expect(moved[0].clips[0].start).toBe(2);
    expect(resized[0].clips[0].end).toBe(4);

    const { container, rerender } = render(
      <TimelineEditor
        tracks={tracks}
        duration={10}
        currentTime={2}
        markers={[{ id: "marker", time: 5, label: "Middle" }]}
        onCurrentTimeChange={onCurrentTimeChange}
        onTracksChange={onTracksChange}
        onSelectedClipChange={onSelectedClipChange}
        onClipDelete={onClipDelete}
        snapInterval={1}
        pixelsPerSecond={72}
      />,
    );

    expect(screen.getByText("Main")).toBeTruthy();
    expect(screen.getByText("Intro")).toBeTruthy();
    expect(container.querySelector("[data-slot='timeline-editor-marker']")).toBeTruthy();
    expect(container.querySelector("[data-slot='timeline-editor-playhead']")).toBeTruthy();

    fireEvent.pointerDown(container.querySelector("[data-slot='timeline-editor-ruler']")!, {
      clientX: 360,
    });
    expect(onCurrentTimeChange).toHaveBeenCalled();

    const clip = screen.getByRole("button", { name: "Intro" });
    fireEvent.pointerDown(clip, { clientX: 0 });
    expect(onSelectedClipChange).toHaveBeenCalledWith(
      "intro",
      expect.objectContaining({ id: "intro" }),
    );
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, {
      clientX: 72,
    });
    expect(onTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clips: [expect.objectContaining({ id: "intro" })],
        }),
      ]),
    );

    const resizeHandle = container.querySelector("[data-slot='timeline-editor-resize-end']")!;
    fireEvent.pointerDown(resizeHandle, { clientX: 0 });
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, {
      clientX: 72,
    });
    expect(onTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clips: [expect.objectContaining({ id: "intro" })],
        }),
      ]),
    );

    fireEvent.keyDown(container.querySelector("[data-slot='timeline-editor']")!, {
      key: "ArrowRight",
    });
    fireEvent.keyDown(container.querySelector("[data-slot='timeline-editor']")!, { key: "Delete" });
    expect(onClipDelete).toHaveBeenCalledWith("intro");

    onTracksChange.mockClear();
    rerender(
      <TimelineEditor
        tracks={tracks}
        duration={10}
        readOnly
        onTracksChange={onTracksChange}
        pixelsPerSecond={72}
      />,
    );
    fireEvent.pointerDown(screen.getByRole("button", { name: "Intro" }), { clientX: 0 });
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, {
      clientX: 72,
    });
    expect(onTracksChange).not.toHaveBeenCalled();
  });

  test("renders AnnotationCanvas and supports select, draw, polygon, move, delete, and read-only", () => {
    const initialAnnotations: AnnotationCanvasAnnotation[] = [
      {
        id: "box",
        shape: "rectangle",
        label: "Box",
        color: "#2563eb",
        points: [
          { x: 10, y: 10 },
          { x: 40, y: 40 },
        ],
      },
    ];
    const onAnnotationsChange = vi.fn();
    const onSelectedAnnotationChange = vi.fn();

    function Harness({ readOnly = false }: { readOnly?: boolean }) {
      const [annotations, setAnnotations] = React.useState(initialAnnotations);
      const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | null>(null);
      const [tool, setTool] = React.useState<AnnotationCanvasTool>("select");

      return (
        <AnnotationCanvas
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          tool={tool}
          width={100}
          height={100}
          readOnly={readOnly}
          onToolChange={setTool}
          onSelectedAnnotationChange={(annotationId, annotation) => {
            setSelectedAnnotationId(annotationId);
            onSelectedAnnotationChange(annotationId, annotation);
          }}
          onAnnotationsChange={(nextAnnotations) => {
            setAnnotations(nextAnnotations);
            onAnnotationsChange(nextAnnotations);
          }}
        />
      );
    }

    const { container, rerender } = render(<Harness />);
    const surface = screen.getByRole("img", { name: "Annotation canvas" });
    const canvas = container.querySelector("[data-slot='annotation-canvas']")!;

    fireEvent.pointerDown(container.querySelector("[data-slot='annotation-canvas-annotation']")!, {
      clientX: 10,
      clientY: 10,
    });
    expect(onSelectedAnnotationChange).toHaveBeenCalledWith(
      "box",
      expect.objectContaining({ id: "box" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Rectangle" }));
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(surface, { clientX: 60, clientY: 60 });
    fireEvent.pointerUp(surface);
    expect(onAnnotationsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ shape: "rectangle" })]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Point" }));
    fireEvent.pointerDown(surface, { clientX: 70, clientY: 70 });
    expect(onAnnotationsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ shape: "point" })]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Polygon" }));
    fireEvent.pointerDown(surface, { clientX: 10, clientY: 80 });
    fireEvent.pointerDown(surface, { clientX: 30, clientY: 80 });
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 95 });
    fireEvent.doubleClick(surface);
    expect(onAnnotationsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ shape: "polygon" })]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.pointerDown(container.querySelector("[data-slot='annotation-canvas-annotation']")!, {
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerMove(surface, { clientX: 20, clientY: 20 });
    fireEvent.pointerUp(surface);
    expect(onAnnotationsChange).toHaveBeenCalled();

    fireEvent.keyDown(canvas, { key: "Delete" });
    expect(onAnnotationsChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: "box" })]),
    );

    onAnnotationsChange.mockClear();
    rerender(<Harness readOnly />);
    fireEvent.click(screen.getByRole("button", { name: "Rectangle" }));
    fireEvent.pointerDown(surface, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(surface, { clientX: 60, clientY: 60 });
    fireEvent.pointerUp(surface);
    expect(onAnnotationsChange).not.toHaveBeenCalled();
  });

  test("renders WorkflowBuilder and supports selection, drag, connections, validation, and delete", () => {
    const initialNodes: WorkflowBuilderNodeData[] = [
      {
        id: "source",
        label: "Source",
        x: 20,
        y: 40,
        outputs: [{ id: "document", label: "Document", kind: "document" }],
      },
      {
        id: "ocr",
        label: "OCR",
        x: 280,
        y: 40,
        inputs: [{ id: "document", label: "Document", kind: "document" }],
        outputs: [{ id: "text", label: "Text", kind: "text" }],
      },
      {
        id: "classify",
        label: "Classify",
        x: 540,
        y: 80,
        inputs: [{ id: "text", label: "Text", kind: "text" }],
      },
    ];
    const initialEdges: WorkflowBuilderEdge[] = [
      {
        id: "ocr-classify",
        sourceNodeId: "ocr",
        sourcePortId: "text",
        targetNodeId: "classify",
        targetPortId: "text",
      },
    ];
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const onSelectionChange = vi.fn();

    function Harness() {
      const [nodes, setNodes] = React.useState(initialNodes);
      const [edges, setEdges] = React.useState(initialEdges);

      return (
        <WorkflowBuilder
          nodes={nodes}
          edges={edges}
          onSelectionChange={onSelectionChange}
          onNodesChange={(nextNodes) => {
            setNodes(nextNodes);
            onNodesChange(nextNodes);
          }}
          onEdgesChange={(nextEdges) => {
            setEdges(nextEdges);
            onEdgesChange(nextEdges);
          }}
        />
      );
    }

    const { container } = render(<Harness />);
    const builder = container.querySelector("[data-slot='workflow-builder']")!;
    const surface = container.querySelector("[data-slot='workflow-builder-surface']")!;

    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "node", id: "source" }),
    );

    fireEvent.mouseDown(screen.getByRole("button", { name: "Source" }), {
      clientX: 20,
      clientY: 40,
    });
    fireEvent.mouseMove(surface, { clientX: 60, clientY: 70 });
    fireEvent.mouseUp(surface);
    expect(onNodesChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "source", x: 60, y: 70 })]),
    );

    onEdgesChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Start Source Document" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect to OCR Document" }));
    expect(onEdgesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ sourceNodeId: "source", targetNodeId: "ocr" }),
      ]),
    );

    onEdgesChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Start Source Document" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect to OCR Document" }));
    expect(onEdgesChange).not.toHaveBeenCalled();

    expect(
      getWorkflowBuilderConnectionValidity({
        nodes: initialNodes,
        edges: [],
        sourceNodeId: "ocr",
        sourcePortId: "text",
        targetNodeId: "ocr",
        targetPortId: "document",
      }),
    ).toEqual({ valid: false, reason: "self-connection" });

    onNodesChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Classify" }));
    fireEvent.keyDown(builder, { key: "Delete" });
    expect(onNodesChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: "classify" })]),
    );
  });
});
