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
} from "../src";
import { AtlasTheme, atlasTheme, uiTheme as atlasUiTheme } from "../src/atlas";
import {
  BobbaTheme,
  Button as BobbaButton,
  bobbaTheme,
  uiTheme as bobbaUiTheme,
} from "../src/bobba";
import { PaperTheme, paperTheme, uiTheme as paperUiTheme } from "../src/paper";
import { StudioTheme, studioTheme, uiTheme as studioUiTheme } from "../src/studio";
import {
  Button as ZleekButton,
  ZleekTheme,
  uiTheme as zleekUiTheme,
  zleekTheme,
} from "../src/zleek";

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

describe("@moritzbrantner/ui", () => {
  test("declares the reusable design-system package contract", () => {
    const packageJson = JSON.parse(readFileSync("packages/ui/package.json", "utf8"));
    const consumerExample = readFileSync("packages/ui/examples/consumer/src/App.tsx", "utf8");

    expect(packageJson.name).toBe("@moritzbrantner/ui");
    expect(packageJson.private).toBe(false);
    expect(packageJson.peerDependencies.react).toBeTruthy();
    expect(packageJson.peerDependencies["react-dom"]).toBeTruthy();
    expect(packageJson.files).toEqual(
      expect.arrayContaining(["dist", "styles.css", "zleek", "bobba", "atlas", "studio", "paper"]),
    );
    expect(packageJson.sideEffects).toEqual(expect.arrayContaining(["*.css"]));
    expect(packageJson.exports["./styles.css"]).toBe("./styles.css");
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

  test("exports design-system component entrypoints", () => {
    const allThemeNames = [
      "zleek",
      "bobba",
      "atlas",
      "studio",
      "paper",
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
    expect(uiThemeNames).toEqual(["bobba", "zleek", "atlas", "studio", "paper"]);
    expect(defaultUiThemeName).toBe("bobba");
    expect(uiThemeLabels.paper).toBe("Paper");
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

    expect(selectedButton.className).toContain("aria-[pressed=true]:-translate-y-[1px]");
    expect(selectedButton.className).toContain("aria-[pressed=true]:scale-[1.055]");
    expect(selectedButton.className).toContain("data-[state=on]:scale-[1.055]");
    expect(selectedButton.className).toContain("aria-[pressed=true]:shadow-[0_22px");
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

  test("opens context menus and invokes selected menu actions", async () => {
    const onSelect = vi.fn();

    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button variant="outline">Clip</Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onSelect}>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByRole("button", { name: "Clip" }));

    const item = await screen.findByText("Duplicate");
    fireEvent.click(item);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("shows shortcut hints based on pressed modifiers", async () => {
    render(
      <>
        <CommandShortcut data-testid="plain-command-shortcut" shortcut="r" />
        <ContextMenuShortcut data-testid="child-plain-shortcut">O</ContextMenuShortcut>
        <DropdownMenuShortcut data-testid="modified-dropdown-shortcut" shortcut="ctrl+k" />
        <MenubarShortcut data-testid="child-modified-shortcut">Ctrl+N</MenubarShortcut>
      </>,
    );

    expect(screen.getByTestId("plain-command-shortcut").textContent).toBe("R");
    expect(screen.getByTestId("child-plain-shortcut").textContent).toBe("O");
    expect(screen.queryByTestId("modified-dropdown-shortcut")).toBeNull();
    expect(screen.queryByTestId("child-modified-shortcut")).toBeNull();

    fireEvent.keyDown(window, { ctrlKey: true, key: "Control" });

    await waitFor(() => {
      expect(screen.queryByTestId("plain-command-shortcut")).toBeNull();
      expect(screen.queryByTestId("child-plain-shortcut")).toBeNull();
      expect(screen.getByTestId("modified-dropdown-shortcut").textContent).toBe("Ctrl+K");
      expect(screen.getByTestId("child-modified-shortcut").textContent).toBe("Ctrl+N");
    });

    fireEvent.keyUp(window, { ctrlKey: false, key: "Control" });

    await waitFor(() => {
      expect(screen.getByTestId("plain-command-shortcut").textContent).toBe("R");
      expect(screen.getByTestId("child-plain-shortcut").textContent).toBe("O");
      expect(screen.queryByTestId("modified-dropdown-shortcut")).toBeNull();
      expect(screen.queryByTestId("child-modified-shortcut")).toBeNull();
    });
  });

  test("opens dialogs from triggers and renders accessible content", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Package details</DialogTitle>
            <DialogDescription>Stable downstream dialog contract.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open details" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Package details")).toBeTruthy();
    expect(screen.getByText("Stable downstream dialog contract.")).toBeTruthy();
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

    const upload = screen.getByRole("progressbar", { name: "Upload progress" });
    const fetching = screen.getByRole("progressbar", { name: "Fetching package" });

    expect(upload.getAttribute("aria-valuenow")).toBe("42");
    expect(upload.getAttribute("aria-valuemax")).toBe("100");
    expect(screen.getByText("42%")).toBeTruthy();
    expect(fetching.getAttribute("aria-valuenow")).toBeNull();
    expect(fetching.getAttribute("data-indeterminate")).toBe("true");
  });

  test("merges class names", () => {
    expect(cn("px-4", "px-2", "font-semibold")).toBe("px-2 font-semibold");
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

  test("opens a mobile slide with accessible drawer content", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MobileSlide>
        <MobileSlideTrigger asChild>
          <Button>Open filters</Button>
        </MobileSlideTrigger>
        <MobileSlideContent showCloseButton>
          <MobileSlideHeader>
            <MobileSlideTitle>Filters</MobileSlideTitle>
            <MobileSlideDescription>Review queue controls.</MobileSlideDescription>
          </MobileSlideHeader>
          <MobileSlideBody>Only show blockers.</MobileSlideBody>
          <MobileSlideFooter>
            <MobileSlideClose asChild>
              <Button>Apply</Button>
            </MobileSlideClose>
          </MobileSlideFooter>
        </MobileSlideContent>
      </MobileSlide>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open filters" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByText("Only show blockers.")).toBeTruthy();
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

  test("renders a custom calendar cell component", () => {
    function CustomCell({ children, events = [], ...props }: CalendarCellComponentProps) {
      return (
        <CalendarDayButton {...props}>
          {children}
          <span data-testid={`cell-${props.day.date.getDate()}`}>marker</span>
          {events.some((event) => event.summary === "Design sync") ? (
            <span data-testid="design-sync-event">event</span>
          ) : null}
        </CalendarDayButton>
      );
    }

    render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="single"
        showOutsideDays={false}
        cellComponent={CustomCell}
        icsData={calendarIcsData}
      />,
    );

    expect(screen.getByTestId("cell-15")).toBeTruthy();
    expect(screen.getByTestId("design-sync-event")).toBeTruthy();
  });

  test("renders a custom calendar day component through the day component API", () => {
    function CustomDay(props: CalendarDayComponentProps) {
      return (
        <CalendarDayButton {...props}>
          {props.children}
          <span data-testid={`day-${props.day.date.getDate()}`}>custom</span>
        </CalendarDayButton>
      );
    }

    const { container } = render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="single"
        showOutsideDays={false}
        dayComponent={CustomDay}
      />,
    );

    expect(screen.getByTestId("day-15")).toBeTruthy();
    expect(container.querySelector("[data-day='2026-04-15']")?.className).toContain(
      "size-(--cell-size)",
    );
  });

  test("marks range endpoints for rounded range styling", () => {
    const { container } = render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="range"
        showOutsideDays={false}
        selected={{
          from: new Date(2026, 3, 14),
          to: new Date(2026, 3, 18),
        }}
      />,
    );

    const rangeStart = container.querySelector("[data-range-start='true']");
    const rangeEnd = container.querySelector("[data-range-end='true']");

    expect(rangeStart).toBeTruthy();
    expect(rangeEnd).toBeTruthy();
    expect(rangeStart?.className).toContain("data-[range-start=true]:rounded-l-(--cell-radius)");
    expect(rangeEnd?.className).toContain("data-[range-end=true]:rounded-r-(--cell-radius)");
  });

  test("renders event summaries from jcal data", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="single"
        showOutsideDays={false}
        icsData={calendarIcsData}
      />,
    );

    expect(screen.getAllByText(/Design sync/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Release window").length).toBeGreaterThan(1);
  });

  test("renders calendar cards with listed events", () => {
    const { container } = render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="single"
        showOutsideDays={false}
        variant="cards"
        icsData={calendarIcsData}
      />,
    );

    const calendar = container.querySelector("[data-slot='calendar']");
    const eventDay = container.querySelector("[data-has-events='true']");

    expect(calendar?.className).toContain("overflow-x-auto");
    expect(eventDay?.className).toContain("bg-card");
    expect(eventDay?.className).toContain("min-h-36");
    expect(screen.getAllByText(/Design sync/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("All day").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Product summit").length).toBe(3);
    expect(screen.getAllByText("No events").length).toBeGreaterThan(0);

    const multiDaySegments = container.querySelectorAll("[data-multi-day-event='true']");
    const startSegment = container.querySelector("[data-calendar-event-segment='start']");
    const middleSegment = container.querySelector("[data-calendar-event-segment='middle']");
    const endSegment = container.querySelector("[data-calendar-event-segment='end']");

    expect(multiDaySegments.length).toBeGreaterThan(2);
    expect(startSegment?.className).toContain("[clip-path:polygon(0_50%");
    expect(middleSegment).toBeTruthy();
    expect(endSegment?.className).toContain("100%_50%");
  });

  test("exports the calendar card day component for custom layouts", () => {
    const { container } = render(
      <Calendar
        defaultMonth={new Date(2026, 3, 1)}
        mode="single"
        showOutsideDays={false}
        dayComponent={CalendarCardDayButton}
        icsData={calendarIcsData}
      />,
    );

    expect(container.querySelector("[data-has-events='true']")?.className).toContain("bg-card");
    expect(screen.getAllByText(/Design sync/).length).toBeGreaterThan(0);
  });

  test("renders an animated glass navbar with an open submenu", () => {
    render(
      <PlatformNavbar
        brand="Platform"
        groups={navigationGroups}
        activeItemId="people"
        defaultOpenGroupId="workspace"
        variant="web"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeTruthy();
    const trigger = screen.getByRole("button", { name: /Workspace/ });
    const submenu = screen
      .getByText("Directory and profiles.")
      .closest('[data-slot="platform-navbar-submenu"]');

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(submenu?.id);
    expect(submenu?.className).toContain("fixed");
    expect(submenu?.className).toContain("z-[100]");
    expect(screen.getByRole("link", { name: /People/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Directory and profiles.")).toBeTruthy();
  });

  test("keeps only the latest navbar submenu open across mounted navbars", async () => {
    render(
      <>
        <PlatformNavbar
          aria-label="First navigation"
          brand="First"
          groups={navigationGroups}
          defaultOpenGroupId="discover"
          variant="web"
        />
        <PlatformNavbar
          aria-label="Second navigation"
          brand="Second"
          groups={navigationGroups}
          defaultOpenGroupId="workspace"
          variant="web"
        />
      </>,
    );

    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot="platform-navbar-submenu"]').length).toBe(1);
    });
    expect(screen.queryByText("Open routes for visitors.")).toBeNull();
    expect(screen.getByText("Directory and profiles.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /Discover/ })[0]);

    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot="platform-navbar-submenu"]').length).toBe(1);
    });
    expect(screen.getByText("Open routes for visitors.")).toBeTruthy();
    expect(screen.queryByText("Directory and profiles.")).toBeNull();
  });

  test("opens submenus and reports selected navbar items", () => {
    const onNavigate = vi.fn();

    render(
      <PlatformNavbar
        brand="Platform"
        groups={navigationGroups}
        defaultOpenGroupId={null}
        onNavigate={onNavigate}
        variant="desktop"
      />,
    );

    expect(screen.queryByRole("link", { name: /About/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Discover/ }));
    expect(screen.getByRole("link", { name: /About/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: /Story Demo/ }));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "story" }),
      expect.objectContaining({ id: "discover" }),
    );
  });

  test("renders DataGrid workflows for filtering, sorting, selection, columns, and pagination", async () => {
    type Row = {
      id: string;
      name: string;
      status: string;
    };
    const rows: Row[] = [
      { id: "1", name: "Charlie", status: "pending" },
      { id: "2", name: "Alpha", status: "paid" },
      { id: "3", name: "Beta", status: "overdue" },
    ];
    const columns: ColumnDef<Row>[] = [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
      },
      {
        accessorKey: "status",
        header: "status",
      },
    ];
    const onSelectedRowsChange = vi.fn();

    render(
      <DataGrid
        columns={columns}
        data={rows}
        enableRowSelection
        pageSize={2}
        onSelectedRowsChange={onSelectedRowsChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search rows"), { target: { value: "Beta" } });
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.queryByText("Charlie")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search rows"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(screen.getByText("Alpha")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith([expect.objectContaining({ name: "Alpha" })]);
    });

    expect(screen.getByRole("button", { name: /View/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Charlie")).toBeTruthy();
  });

  test("toggles DataGrid column visibility through the table toolbar API", () => {
    type Row = { name: string; status: string };
    const columns: ColumnDef<Row>[] = [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "status", header: "Status" },
    ];

    render(
      <DataGrid
        columns={columns}
        data={[{ name: "Alpha", status: "paid" }]}
        toolbar={(table) => (
          <button type="button" onClick={() => table.getColumn("status")?.toggleVisibility(false)}>
            Hide status
          </button>
        )}
      />,
    );

    expect(screen.getByText("paid")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide status" }));
    expect(screen.queryByText("paid")).toBeNull();
  });

  test("filters DataGrid columns from the header context menu", async () => {
    type Row = {
      name: string;
      status: string;
    };
    const columns: ColumnDef<Row>[] = [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "status", header: "Status" },
    ];

    render(
      <DataGrid
        columns={columns}
        data={[
          { name: "Alpha", status: "paid" },
          { name: "Beta", status: "pending" },
          { name: "Charlie", status: "overdue" },
        ]}
      />,
    );

    fireEvent.contextMenu(screen.getByText("Status"));

    expect(await screen.findByText("Filter Status")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "Filter Status by paid" }));

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeTruthy();
      expect(screen.queryByText("Beta")).toBeNull();
      expect(screen.queryByText("Charlie")).toBeNull();
    });
  });

  test("uses numeric inputs for number column header filters", async () => {
    type Row = {
      name: string;
      amount: number;
    };
    const columns: ColumnDef<Row>[] = [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "amount", header: "Amount" },
    ];

    render(
      <DataGrid
        columns={columns}
        data={[
          { name: "Small", amount: 15 },
          { name: "Medium", amount: 40 },
          { name: "Large", amount: 90 },
        ]}
      />,
    );

    fireEvent.contextMenu(screen.getByText("Amount"));

    expect(await screen.findByText("Filter Amount")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Minimum Amount"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Maximum Amount"), { target: { value: "80" } });

    await waitFor(() => {
      expect(screen.queryByText("Small")).toBeNull();
      expect(screen.getByText("Medium")).toBeTruthy();
      expect(screen.queryByText("Large")).toBeNull();
    });
  });

  test("renders DataGrid loading, empty, and error states", () => {
    const columns: ColumnDef<{ name: string }>[] = [{ accessorKey: "name", header: "Name" }];
    const { rerender } = render(<DataGrid columns={columns} data={[]} loading />);

    expect(screen.getByRole("status").textContent).toContain("Loading rows");

    rerender(<DataGrid columns={columns} data={[]} />);
    expect(screen.getByText("No results.")).toBeTruthy();

    rerender(<DataGrid columns={columns} data={[]} error="Load failed" />);
    expect(screen.getByText("Load failed")).toBeTruthy();
  });

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
    expect(onSelectionChange).toHaveBeenCalledWith(["hero"], [
      expect.objectContaining({ id: "hero" }),
    ]);
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
      expect.arrayContaining([expect.objectContaining({ id: "folder" }), expect.objectContaining({ id: "hero" })]),
    );
  });

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
    expect(onSelectedClipChange).toHaveBeenCalledWith("intro", expect.objectContaining({ id: "intro" }));
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, { clientX: 72 });
    expect(onTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clips: [expect.objectContaining({ id: "intro" })],
        }),
      ]),
    );

    const resizeHandle = container.querySelector("[data-slot='timeline-editor-resize-end']")!;
    fireEvent.pointerDown(resizeHandle, { clientX: 0 });
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, { clientX: 72 });
    expect(onTracksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clips: [expect.objectContaining({ id: "intro" })],
        }),
      ]),
    );

    fireEvent.keyDown(container.querySelector("[data-slot='timeline-editor']")!, { key: "ArrowRight" });
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
    fireEvent.pointerMove(container.querySelector("[data-slot='timeline-editor']")!, { clientX: 72 });
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
    expect(onSelectedAnnotationChange).toHaveBeenCalledWith("box", expect.objectContaining({ id: "box" }));

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
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ type: "node", id: "source" }));

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
      expect.arrayContaining([expect.objectContaining({ sourceNodeId: "source", targetNodeId: "ocr" })]),
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
      expect.objectContaining({ rules: expect.arrayContaining([expect.objectContaining({ fieldId: "name" })]) }),
    );

    fireEvent.change(screen.getAllByLabelText("Rule field")[0], { target: { value: "rows" } });
    fireEvent.change(screen.getAllByLabelText("Rule operator")[0], { target: { value: "gt" } });
    fireEvent.change(screen.getAllByLabelText("Rule value")[0], { target: { value: "1000" } });
    expect(onExpressionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ rules: expect.arrayContaining([expect.objectContaining({ value: 1000 })]) }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add group" }));
    expect(onExpressionChange).toHaveBeenCalledWith(
      expect.objectContaining({ rules: expect.arrayContaining([expect.objectContaining({ combinator: "and" })]) }),
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
