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
  Input,
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
} from "..";
import { AtlasTheme, atlasTheme, uiTheme as atlasUiTheme } from "../atlas";
import { BobbaTheme, Button as BobbaButton, bobbaTheme, uiTheme as bobbaUiTheme } from "../bobba";
import { PaperTheme, paperTheme, uiTheme as paperUiTheme } from "../paper";
import { StudioTheme, studioTheme, uiTheme as studioUiTheme } from "../studio";
import { Button as ZleekButton, ZleekTheme, uiTheme as zleekUiTheme, zleekTheme } from "../zleek";

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

describe("@moritzbrantner/ui button-and-form", () => {
  test("renders shared primitives in jsdom", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Shared UI</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Press</Button>
        </CardContent>
      </Card>,
    );

    expect(screen.getByRole("button", { name: "Press" })).toBeTruthy();
    expect(screen.getByText("Shared UI")).toBeTruthy();
  });

  test("renders an app layout page shell with semantic content", () => {
    const { container } = render(
      <PageShell>
        <PageHeader>
          <PageTitle>Operations dashboard</PageTitle>
        </PageHeader>
        <PageContent>Release queue</PageContent>
      </PageShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Operations dashboard" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toContain("Release queue");
    expect(container.querySelector("[data-slot='page-shell']")?.className).toContain(
      "min-h-screen",
    );
  });

  test("renders page header title, description, and actions", () => {
    render(
      <PageHeader>
        <div>
          <PageTitle>Package review</PageTitle>
          <PageDescription>Track shared component readiness.</PageDescription>
        </div>
        <PageActions>
          <Button>Refresh</Button>
        </PageActions>
      </PageHeader>,
    );

    expect(screen.getByText("Package review")).toBeTruthy();
    expect(screen.getByText("Track shared component readiness.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  });

  test("renders surface variants with data slots", () => {
    const { container } = render(
      <Surface variant="muted">
        <SurfaceHeader>
          <SurfaceTitle>Review focus</SurfaceTitle>
          <SurfaceDescription>Interactive package examples.</SurfaceDescription>
        </SurfaceHeader>
        <SurfaceContent>Storybook and tests</SurfaceContent>
      </Surface>,
    );

    const surface = container.querySelector("[data-slot='surface']");

    expect(surface).toBeTruthy();
    expect(surface?.getAttribute("data-variant")).toBe("muted");
    expect(surface?.className).toContain("bg-muted/35");
    expect(screen.getByText("Review focus")).toBeTruthy();
  });

  test("renders sidebar-right section grids", () => {
    const { container } = render(
      <SectionGrid columns="sidebar-right">
        <div>Main</div>
        <div>Aside</div>
      </SectionGrid>,
    );

    const grid = container.querySelector("[data-slot='section-grid']");

    expect(grid?.getAttribute("data-columns")).toBe("sidebar-right");
    expect(grid?.className).toContain("xl:grid-cols-[1.18fr_0.82fr]");
  });

  test("renders sticky action bars with child buttons", () => {
    const { container } = render(
      <ActionBar sticky>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </ActionBar>,
    );

    const actionBar = container.querySelector("[data-slot='action-bar']");

    expect(actionBar?.getAttribute("data-sticky")).toBe("true");
    expect(actionBar?.className).toContain("sticky");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  test("uses a 150ms lit pressed state for buttons", () => {
    render(<Button>Press</Button>);

    const button = screen.getByRole("button", { name: "Press" });

    expect(button.className).toContain("duration-150");
    expect(button.className).toContain("active:brightness-110");
  });

  test("uses public UI tokens for primitive shape and spacing", () => {
    const { container } = render(
      <Card>
        <CardContent>
          <Input aria-label="Name" />
          <Button>Save</Button>
        </CardContent>
      </Card>,
    );

    const card = container.querySelector("[data-slot='card']");
    const input = screen.getByLabelText("Name");
    const button = screen.getByRole("button", { name: "Save" });

    expect(card?.className).toContain("rounded-[var(--ui-card-radius");
    expect(card?.className).toContain("gap-[var(--ui-card-gap");
    expect(input.className).toContain("h-[var(--ui-input-height");
    expect(input.className).toContain("rounded-[var(--ui-input-radius");
    expect(button.className).toContain("h-[var(--ui-button-height-md");
    expect(button.className).toContain("rounded-[var(--ui-button-radius");
  });

  test("mirrors hover styles for selected buttons and tap styles for Enter", () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();

    render(
      <>
        <Button aria-pressed="true">Selected</Button>
        <Button onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
          Keyboard
        </Button>
      </>,
    );

    const selectedButton = screen.getByRole("button", { name: "Selected" });
    const keyboardButton = screen.getByRole("button", { name: "Keyboard" });

    expect(selectedButton.className).toContain(
      "aria-[pressed=true]:translate-y-[var(--ui-motion-hover-y)]",
    );
    expect(selectedButton.className).toContain(
      "aria-[pressed=true]:scale-[var(--ui-motion-hover-scale)]",
    );
    expect(selectedButton.className).toContain(
      "data-[state=on]:scale-[var(--ui-motion-hover-scale)]",
    );
    expect(selectedButton.className).toContain(
      "aria-[pressed=true]:shadow-[var(--ui-shadow-interactive)]",
    );
    expect(keyboardButton.className).toContain("data-[keyboard-active=true]:scale-[0.98]");
    expect(keyboardButton.className).toContain("data-[keyboard-active=true]:brightness-110");

    fireEvent.keyDown(keyboardButton, { key: "Enter" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(keyboardButton.getAttribute("data-keyboard-active")).toBe("true");

    fireEvent.keyUp(keyboardButton, { key: "Enter" });

    expect(onKeyUp).toHaveBeenCalledTimes(1);
    expect(keyboardButton.getAttribute("data-keyboard-active")).toBeNull();
  });

  test("preserves button contract details for downstream asChild usage", () => {
    render(
      <div>
        <Button asChild variant="outline" className="custom-link-class">
          <a href="/docs">Docs</a>
        </Button>
        <Button variant="destructive" disabled className="custom-disabled-class">
          Delete
        </Button>
      </div>,
    );

    const link = screen.getByRole("link", { name: "Docs" });
    const disabledButton = screen.getByRole("button", { name: "Delete" });

    expect(link.getAttribute("data-slot")).toBe("button");
    expect(link.getAttribute("data-variant")).toBe("outline");
    expect(link.className).toContain("custom-link-class");
    expect(disabledButton).toHaveProperty("disabled", true);
    expect(disabledButton.getAttribute("data-variant")).toBe("destructive");
    expect(disabledButton.className).toContain("custom-disabled-class");
  });

  test("renders auxiliary catalog components with glass styling slots", () => {
    const { container } = render(
      <div>
        <ButtonGroup>
          <Button>Run</Button>
          <ButtonGroupText>
            <Kbd>R</Kbd>
          </ButtonGroupText>
        </ButtonGroup>
        <Empty>
          <EmptyTitle>No packages</EmptyTitle>
          <EmptyDescription>Create a package to continue.</EmptyDescription>
        </Empty>
      </div>,
    );

    expect(container.querySelector("[data-slot='button-group']")).toBeTruthy();
    expect(container.querySelector("[data-slot='button-group-text']")).toBeTruthy();
    expect(container.querySelector("[data-slot='kbd']")).toBeTruthy();
    expect(container.querySelector("[data-slot='empty']")).toBeTruthy();
    expect(screen.getByText("No packages")).toBeTruthy();
  });

  test("renders loading indicators with accessible status and progress state", () => {
    const { container } = render(
      <div>
        <Spinner size="lg" />
        <DotsSpinner label="Syncing package" />
        <PulseSpinner decorative />
        <LoadingBar value={42} label="Upload progress" showValue />
        <LoadingBar indeterminate label="Fetching package" />
      </div>,
    );

    expect(screen.getByRole("status", { name: "Loading" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "Syncing package" })).toBeTruthy();
    expect(
      container.querySelector("[data-slot='pulse-spinner']")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(container.querySelectorAll("[data-slot='spinner-loop'] animate")).toHaveLength(3);

    const upload = screen.getByRole("progressbar", { name: "Upload progress" });
    const fetching = screen.getByRole("progressbar", { name: "Fetching package" });

    expect(upload.getAttribute("aria-valuenow")).toBe("42");
    expect(upload.getAttribute("aria-valuemax")).toBe("100");
    expect(screen.getByText("42%")).toBeTruthy();
    expect(fetching.getAttribute("aria-valuenow")).toBeNull();
    expect(fetching.getAttribute("data-indeterminate")).toBe("true");
  });

  test("renders additional shadcn-inspired display components", () => {
    render(
      <div>
        <CodeBlock>
          <CodeBlockHeader>
            <CodeBlockTitle>install.ts</CodeBlockTitle>
          </CodeBlockHeader>
          <CodeBlockContent>
            <CodeBlockCode>export const ready = true;</CodeBlockCode>
          </CodeBlockContent>
        </CodeBlock>
        <DescriptionList>
          <DescriptionListItem>
            <DescriptionListTerm>Status</DescriptionListTerm>
            <DescriptionListDetail>Ready</DescriptionListDetail>
          </DescriptionListItem>
        </DescriptionList>
        <StatGroup>
          <Stat>
            <StatLabel>Latency</StatLabel>
            <StatValue>42ms</StatValue>
            <StatDelta variant="positive">12% faster</StatDelta>
          </Stat>
        </StatGroup>
        <Timeline>
          <TimelineItem>
            <div>
              <TimelineIndicator />
              <TimelineConnector />
            </div>
            <TimelineContent>
              <TimelineTitle>Published</TimelineTitle>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </div>,
    );

    expect(screen.getByText("install.ts")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("42ms")).toBeTruthy();
    expect(screen.getByText("Published")).toBeTruthy();
  });

  test("renders workflow and utility components", async () => {
    const copy = vi.fn();
    const onCopied = vi.fn();

    const { container } = render(
      <div>
        <Toolbar aria-label="Editor toolbar">
          <ToolbarGroup>
            <ToolbarTitle>Release notes</ToolbarTitle>
          </ToolbarGroup>
          <ToolbarSpacer />
          <ToolbarGroup>
            <Button>Save</Button>
          </ToolbarGroup>
        </Toolbar>
        <Stepper orientation="vertical">
          <StepperItem status="complete">
            <StepperIndicator />
            <StepperContent>
              <StepperTitle>Configured</StepperTitle>
              <StepperDescription>Package metadata is ready.</StepperDescription>
            </StepperContent>
            <StepperConnector />
          </StepperItem>
          <StepperItem status="current">
            <StepperIndicator>2</StepperIndicator>
            <StepperContent>
              <StepperTitle>Reviewing</StepperTitle>
            </StepperContent>
          </StepperItem>
        </Stepper>
        <Dropzone htmlFor="test-upload">
          <DropzoneInput id="test-upload" />
          <DropzoneIcon>
            <DropzoneDefaultIcon />
          </DropzoneIcon>
          <DropzoneContent>
            <DropzoneTitle>Upload artifact</DropzoneTitle>
            <DropzoneDescription>Drop a package artifact here.</DropzoneDescription>
          </DropzoneContent>
        </Dropzone>
        <CopyButton value="copy-value" copy={copy} onCopied={onCopied} />
      </div>,
    );

    expect(screen.getByRole("toolbar", { name: "Editor toolbar" })).toBeTruthy();
    expect(screen.getByText("Configured")).toBeTruthy();
    expect(screen.getByLabelText(/Upload artifact/)).toBeTruthy();
    expect(container.querySelector("[data-slot='dropzone']")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
      expect(copy).toHaveBeenCalledWith("copy-value");
      expect(onCopied).toHaveBeenCalledWith("copy-value");
    });
  });

  test("uses squared toggle and switch controls", () => {
    render(
      <div>
        <Toggle>Grid</Toggle>
        <Switch aria-label="Notifications" />
      </div>,
    );

    expect(screen.getByRole("button", { name: "Grid" }).className).toContain("rounded-md");
    const notificationsSwitch = screen.getByRole("switch", { name: "Notifications" });
    expect(notificationsSwitch.className).toContain("rounded-md");
    expect(notificationsSwitch.className).toContain("data-[size=default]:h-6");
    expect(notificationsSwitch.className).toContain("data-[size=default]:w-11");
  });

  test("renders a labeled toggle setting and reports checked changes", () => {
    const onCheckedChange = vi.fn();

    render(
      <ToggleSetting
        title="Push notifications"
        description="Notify reviewers when package status changes."
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Push notifications" });

    expect(toggle.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  test("renders chat thread, message bubbles, and composer controls", () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());

    render(
      <Chat>
        <ChatHeader>
          <ChatTitle>Release chat</ChatTitle>
        </ChatHeader>
        <ChatThread aria-label="Release conversation">
          <ChatMessage>
            <ChatMessageAvatar>MB</ChatMessageAvatar>
            <ChatMessageContent>
              <ChatMessageMeta>Moritz</ChatMessageMeta>
              <ChatBubble>Ready for review.</ChatBubble>
            </ChatMessageContent>
          </ChatMessage>
          <ChatMessage align="end">
            <ChatMessageContent>
              <ChatMessageMeta>You</ChatMessageMeta>
              <ChatBubble>Running tests now.</ChatBubble>
            </ChatMessageContent>
          </ChatMessage>
        </ChatThread>
        <ChatComposer onSubmit={onSubmit}>
          <ChatComposerInput aria-label="Message" defaultValue="Looks good" />
          <ChatSendButton />
        </ChatComposer>
      </Chat>,
    );

    expect(screen.getByRole("heading", { name: "Release chat" })).toBeTruthy();
    expect(screen.getByRole("log", { name: "Release conversation" })).toBeTruthy();
    expect(screen.getByText("Ready for review.")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement).value).toBe(
      "Looks good",
    );

    fireEvent.submit(screen.getByRole("textbox", { name: "Message" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
