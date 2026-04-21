import { existsSync, readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
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
  ActionBar,
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  cn,
  CopyButton,
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
  Dropzone,
  DropzoneContent,
  DropzoneDefaultIcon,
  DropzoneDescription,
  DropzoneIcon,
  DropzoneInput,
  DropzoneTitle,
  Empty,
  EmptyDescription,
  EmptyTitle,
  Kbd,
  PlatformNavbar,
  type PlatformNavbarGroup,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageShell,
  PageTitle,
  SectionGrid,
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
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
  Toggle,
  Toolbar,
  ToolbarGroup,
  ToolbarSpacer,
  ToolbarTitle,
} from "../src";
import {
  BobbaTheme,
  Button as BobbaButton,
  bobbaTheme,
  uiTheme as bobbaUiTheme,
} from "../src/bobba";
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

  test("exports zleek and bobba component entrypoints", () => {
    render(
      <>
        <ZleekTheme>
          <ZleekButton>Zleek action</ZleekButton>
        </ZleekTheme>
        <BobbaTheme>
          <BobbaButton>Bobba action</BobbaButton>
        </BobbaTheme>
      </>,
    );

    expect(screen.getByRole("button", { name: "Zleek action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bobba action" })).toBeTruthy();
    expect(zleekTheme.name).toBe("zleek");
    expect(bobbaTheme.name).toBe("bobba");
    expect(zleekUiTheme).toBe(zleekTheme);
    expect(bobbaUiTheme).toBe(bobbaTheme);
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
    expect(screen.getByRole("switch", { name: "Notifications" }).className).toContain(
      "rounded-md",
    );
  });

  test("renders a custom calendar cell component", () => {
    function CustomCell({
      children,
      events = [],
      ...props
    }: CalendarCellComponentProps) {
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
    expect(screen.getAllByText("No events").length).toBeGreaterThan(0);
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
});
