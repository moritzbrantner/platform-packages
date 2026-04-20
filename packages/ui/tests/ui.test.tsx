import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  Button,
  Calendar,
  CalendarDayButton,
  type CalendarCellComponentProps,
  type CalendarDayComponentProps,
  type CalendarIcsData,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
  cn,
  DescriptionList,
  DescriptionListDetail,
  DescriptionListItem,
  DescriptionListTerm,
  PlatformNavbar,
  type PlatformNavbarGroup,
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
  Switch,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
  Toggle,
} from "../src";

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

  test("uses a 150ms lit pressed state for buttons", () => {
    render(<Button>Press</Button>);

    const button = screen.getByRole("button", { name: "Press" });

    expect(button.className).toContain("duration-150");
    expect(button.className).toContain("active:brightness-110");
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
    expect(screen.getByRole("button", { name: /Workspace/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("link", { name: /People/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Directory and profiles.")).toBeTruthy();
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
