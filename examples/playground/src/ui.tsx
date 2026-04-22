import { useEffect, useMemo, useState, type SVGProps } from "react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, Legend, XAxis } from "recharts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Calendar,
  CalendarDayButton,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DotsSpinner,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Kbd,
  LoadingBar,
  NativeSelect,
  NativeSelectOption,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UiTheme,
  type CalendarCellComponentProps,
  type CalendarIcsData,
  type UiThemeName,
} from "@moritzbrantner/ui/bobba";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const glassCardClass =
  "rounded-none border-border/60 bg-background/55 shadow-2xl shadow-black/10 supports-backdrop-filter:backdrop-blur-xl";
const glassPanelClass =
  "rounded-none border border-border/50 bg-background/35 supports-backdrop-filter:backdrop-blur-lg";
const glassTileClass =
  "rounded-none border border-border/40 bg-muted/25 supports-backdrop-filter:backdrop-blur-md";
const uiStyleStorageKey = "platform-playground-ui-style";
const zleekStylesheetElementId = "platform-playground-zleek-stylesheet";

const uiStyleOptions = [
  {
    value: "bobba",
    label: "Bobba",
    description: "Default glass UI style",
  },
  {
    value: "zleek",
    label: "Zleek",
    description: "Sharper Zleek package style",
  },
] as const satisfies ReadonlyArray<{
  value: UiThemeName;
  label: string;
  description: string;
}>;

function isUiThemeName(value: string | null): value is UiThemeName {
  return value === "bobba" || value === "zleek";
}

function getInitialUiStyle(): UiThemeName {
  if (typeof window === "undefined") {
    return "bobba";
  }

  const storedStyle = window.localStorage.getItem(uiStyleStorageKey);
  return isUiThemeName(storedStyle) ? storedStyle : "bobba";
}

function usePlaygroundUiStyle(style: UiThemeName) {
  useEffect(() => {
    let cancelled = false;

    window.localStorage.setItem(uiStyleStorageKey, style);
    document.documentElement.dataset.uiStyle = style;

    const existingStyleElement = document.getElementById(
      zleekStylesheetElementId,
    ) as HTMLStyleElement | null;

    if (style === "zleek") {
      const styleElement = existingStyleElement ?? document.createElement("style");
      styleElement.id = zleekStylesheetElementId;

      if (!existingStyleElement) {
        document.head.append(styleElement);
      }

      void import("@moritzbrantner/ui/zleek/styles.css?inline").then(
        ({ default: zleekStylesheetCss }) => {
          if (!cancelled) {
            styleElement.textContent = zleekStylesheetCss;
          }
        },
      );

      return () => {
        cancelled = true;
        styleElement.remove();
        delete document.documentElement.dataset.uiStyle;
      };
    }

    existingStyleElement?.remove();

    return () => {
      delete document.documentElement.dataset.uiStyle;
    };
  }, [style]);
}

function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M6.5 9a5.5 5.5 0 1 1 11 0v4l1.75 2H4.75L6.5 13V9Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function FolderSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
      <path d="M15.5 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path d="m17.4 17.4-1.8-1.8" />
    </svg>
  );
}

function LayoutGridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M8 6h12M8 12h12M8 18h12M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z" />
      <path d="m18.5 14 0.9 2.6 2.6 0.9-2.6 0.9-0.9 2.6-0.9-2.6-2.6-0.9 2.6-0.9 0.9-2.6Z" />
      <path d="m5.5 14 0.7 1.9 1.9 0.7-1.9 0.7-0.7 1.9-0.7-1.9-1.9-0.7 1.9-0.7 0.7-1.9Z" />
    </svg>
  );
}

const deliveryMetrics = [
  { sprint: "S1", adoption: 18, quality: 72 },
  { sprint: "S2", adoption: 31, quality: 79 },
  { sprint: "S3", adoption: 48, quality: 84 },
  { sprint: "S4", adoption: 65, quality: 90 },
] as const;

const releaseRows = [
  { packageName: "@moritzbrantner/ui", version: "0.2.0", status: "Current" },
  {
    packageName: "@moritzbrantner/storytelling",
    version: "0.1.0",
    status: "Preview",
  },
  {
    packageName: "@moritzbrantner/eslint-config",
    version: "0.1.0",
    status: "Infra",
  },
] as const;

const releaseCalendarData = [
  "vcalendar",
  [
    ["version", {}, "text", "2.0"],
    ["prodid", {}, "text", "-//platform-packages//UI Preview//EN"],
  ],
  [
    [
      "vevent",
      [
        ["uid", {}, "text", "design-sync-20260414"],
        ["summary", {}, "text", "Design sync"],
        ["location", {}, "text", "Studio board"],
        ["dtstart", {}, "date-time", "2026-04-14T09:00:00+02:00"],
        ["dtend", {}, "date-time", "2026-04-14T09:45:00+02:00"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "pkg-review-20260414"],
        ["summary", {}, "text", "Package review"],
        ["dtstart", {}, "date-time", "2026-04-14T13:30:00+02:00"],
        ["dtend", {}, "date-time", "2026-04-14T14:15:00+02:00"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "release-window-20260420"],
        ["summary", {}, "text", "Release window"],
        ["description", {}, "text", "Three-day ship window for package refresh."],
        ["dtstart", {}, "date", "2026-04-20"],
        ["dtend", {}, "date", "2026-04-23"],
      ],
      [],
    ],
    [
      "vevent",
      [
        ["uid", {}, "text", "qa-hand-off-20260422"],
        ["summary", {}, "text", "QA hand-off"],
        ["dtstart", {}, "date-time", "2026-04-22T16:00:00+02:00"],
        ["dtend", {}, "date-time", "2026-04-22T17:00:00+02:00"],
      ],
      [],
    ],
  ],
] as const satisfies CalendarIcsData;

function CalendarPreviewDay({
  children,
  events = [],
  maxEventsPerDay = 3,
  ...props
}: CalendarCellComponentProps) {
  const visibleEvents = events.slice(0, maxEventsPerDay);
  const hiddenEventsCount = Math.max(events.length - visibleEvents.length, 0);

  return (
    <CalendarDayButton
      {...props}
      events={[]}
      className="h-full min-h-40 cursor-pointer items-stretch gap-3 rounded-none border border-border/60 bg-background/55 p-3 shadow-md shadow-black/10 transition hover:border-border hover:bg-accent/12 data-[selected-single=true]:border-primary data-[selected-single=true]:bg-accent/18"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="block text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {props.day.date.toLocaleDateString("en-US", { weekday: "short" })}
          </span>
          <span className="block text-2xl font-semibold leading-none">{children}</span>
        </div>
        {events.length > 0 ? (
          <span className="bg-accent px-2.5 py-1 text-[0.65rem] font-medium text-accent-foreground">
            {events.length} event{events.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-1 flex-col gap-2">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <div
              key={`${event.uid ?? event.summary ?? "event"}-${event.start.toISOString()}`}
              className="border border-border/50 bg-muted/25 px-3 py-2"
            >
              <p className="text-sm font-medium leading-tight">
                {event.summary ?? "Untitled event"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {event.isAllDay
                  ? "All day"
                  : event.start.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          ))
        ) : (
          <div className="border border-dashed border-border/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
            No events scheduled.
          </div>
        )}

        {hiddenEventsCount > 0 ? (
          <p className="text-xs font-medium text-muted-foreground">
            +{hiddenEventsCount} more event{hiddenEventsCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </CalendarDayButton>
  );
}

function UiPage() {
  const [uiStyle, setUiStyle] = useState<UiThemeName>(getInitialUiStyle);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(64);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [qaRequired, setQaRequired] = useState(true);
  const [runVisualReview, setRunVisualReview] = useState(true);
  const [shareWithOps, setShareWithOps] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | undefined>(
    new Date(2026, 3, 14),
  );
  usePlaygroundUiStyle(uiStyle);

  const chartConfig = useMemo(
    () => ({
      adoption: {
        label: "Adoption",
        color: "oklch(0.62 0.18 240)",
      },
      quality: {
        label: "Quality",
        color: "oklch(0.72 0.17 145)",
      },
    }),
    [],
  );

  return (
    <UiTheme theme={uiStyle} className="contents">
      <PlaygroundPage
        activePage="ui"
        title="UI package examples"
        description="A wider component gallery for the shared UI package, now styled with sharper glass surfaces so buttons, overlays, forms, and empty states can be checked in one place."
      >
        <section className="mb-4">
          <Card className={glassCardClass}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>UI style</CardTitle>
                  <CardDescription>
                    Switch the gallery between the package style entrypoints.
                  </CardDescription>
                </div>
                <NativeSelect
                  aria-label="UI style"
                  className="w-full sm:w-48"
                  value={uiStyle}
                  onChange={(event) => {
                    const nextStyle = event.currentTarget.value;

                    if (isUiThemeName(nextStyle)) {
                      setUiStyle(nextStyle);
                    }
                  }}
                >
                  {uiStyleOptions.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {uiStyleOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${glassTileClass} p-4 ${
                      uiStyle === option.value ? "border-primary bg-accent/18" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className={glassCardClass}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Actions and feedback</CardTitle>
                  <CardDescription>
                    Exercise buttons, badges, dialogs, toasts, and progress updates.
                  </CardDescription>
                </div>
                <Badge variant="outline">Core primitives</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Release confidence</span>
                  <span className="text-muted-foreground">{progressValue}%</span>
                </div>
                <Progress value={progressValue} />
                <LoadingBar value={progressValue} label="Release loading bar" size="sm" showValue />
                <Slider
                  value={[progressValue]}
                  max={100}
                  step={1}
                  onValueChange={(values) => setProgressValue(values[0] ?? 0)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Package smoke test</DialogTitle>
                      <DialogDescription>
                        This modal is rendered from the shared dialog primitive, so it verifies
                        focus handling, portal rendering, and package styling.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton>
                      <Button
                        onClick={() => {
                          toast.success("Dialog action confirmed");
                          setDialogOpen(false);
                        }}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="secondary"
                  onClick={() => toast.success("Toast rendered through @moritzbrantner/ui")}
                >
                  Trigger toast
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle>Forms and selection</CardTitle>
              <CardDescription>
                Mix inputs, toggles, checkboxes, input groups, and menu-driven fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="release-name">Release name</FieldLabel>
                  <FieldContent>
                    <Input id="release-name" placeholder="Spring package refresh" />
                    <FieldDescription>
                      Use this field to check focus and disabled styling.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="release-notes">Release notes</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="release-notes"
                      defaultValue="Add real app examples so package behavior is visible during development."
                    />
                  </FieldContent>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="alerts">Notifications</FieldLabel>
                  <Switch id="alerts" checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel>Density</FieldLabel>
                  <RadioGroup value={density} onValueChange={setDensity} className="grid-cols-3">
                    {["compact", "comfortable", "spacious"].map((value) => (
                      <label
                        key={value}
                        className={`${glassTileClass} flex items-center gap-2 px-3 py-2 text-sm`}
                      >
                        <RadioGroupItem value={value} />
                        <span className="capitalize">{value}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel>Environment</FieldLabel>
                  <Select defaultValue="preview">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="preview">Preview</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <Separator />

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <InputGroup className="h-10">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>
                      <SearchIcon />
                      Search
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Filter release notes and package names" />
                </InputGroup>

                <NativeSelect className="w-full" defaultValue="canary">
                  <NativeSelectOption value="alpha">Alpha</NativeSelectOption>
                  <NativeSelectOption value="beta">Beta</NativeSelectOption>
                  <NativeSelectOption value="canary">Canary</NativeSelectOption>
                  <NativeSelectOption value="stable">Stable</NativeSelectOption>
                </NativeSelect>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className={`${glassTileClass} flex items-center gap-3 px-3 py-3 text-sm`}>
                  <Checkbox
                    checked={qaRequired}
                    onCheckedChange={(checked) => setQaRequired(checked === true)}
                  />
                  <span>Require QA sign-off before release</span>
                </label>

                <label className={`${glassTileClass} flex items-center gap-3 px-3 py-3 text-sm`}>
                  <Checkbox
                    checked={runVisualReview}
                    onCheckedChange={(checked) => setRunVisualReview(checked === true)}
                  />
                  <span>Include visual review snapshots</span>
                </label>
              </div>

              <Field orientation="horizontal">
                <FieldLabel>Layout mode</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (value) {
                      setViewMode(value);
                    }
                  }}
                >
                  <ToggleGroupItem value="grid">
                    <LayoutGridIcon />
                    Grid
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list">
                    <ListIcon />
                    List
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className={`${glassCardClass} xl:col-span-2`}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Calendar preview</CardTitle>
                  <CardDescription>
                    The calendar accepts jCal-style JSON, extracts `VEVENT`s, and renders the daily
                    schedule directly inside the day cells.
                  </CardDescription>
                </div>
                <Badge variant="outline">ICS JSON</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`${glassPanelClass} w-full p-3`}>
                <Calendar
                  cellComponent={CalendarPreviewDay}
                  icsData={releaseCalendarData}
                  defaultMonth={new Date(2026, 3, 1)}
                  maxEventsPerDay={3}
                  mode="single"
                  selected={selectedCalendarDay}
                  showOutsideDays={false}
                  onSelect={setSelectedCalendarDay}
                  className="w-full rounded-none border border-border/60 bg-background/55 p-4 [--cell-size:10rem]"
                  classNames={{
                    root: "w-full",
                    months: "w-full",
                    month: "relative w-full gap-5 pt-14",
                    nav: "absolute inset-x-4 top-4 z-10 flex items-center justify-between",
                    button_previous:
                      "inline-flex size-10 items-center justify-center rounded-none border border-border/60 bg-background/45 shadow-md shadow-black/10",
                    button_next:
                      "inline-flex size-10 items-center justify-center rounded-none border border-border/60 bg-background/45 shadow-md shadow-black/10",
                    month_caption: "mb-2 min-h-10 px-20 text-lg",
                    caption_label: "text-lg font-semibold",
                    table: "w-full border-separate [border-spacing:0.6rem]",
                    weekdays: "grid grid-cols-7 gap-2",
                    weekday:
                      "flex h-10 items-center border border-border/40 bg-muted/20 px-3 text-left text-xs font-semibold uppercase tracking-[0.18em]",
                    week: "mt-0 grid grid-cols-7 gap-2",
                    day: "min-h-40 rounded-none bg-muted/10",
                    today: "rounded-none bg-accent/20 text-foreground",
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${glassTileClass} p-4`}>
                  <p className="text-sm font-medium">Visible event coverage</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    April 14 carries two timed sessions, and April 20 to 22 shows a multi-day
                    release window sourced from a `date` range, matching all-day ICS semantics.
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Click any day card to move the selection state through the month.
                  </p>
                </div>

                <div className={`${glassTileClass} p-4`}>
                  <p className="text-sm font-medium">Input shape</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The preview feeds `Calendar` a `vcalendar` tuple with nested `vevent` tuples, so
                    the example stays close to the JSON form of an `.ics` payload.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle>Composable navigation patterns</CardTitle>
              <CardDescription>
                Tabs hold an accordion and a package table so you can test layered primitives
                together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="notes">
                <TabsList>
                  <TabsTrigger value="notes">Release notes</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="pt-4">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="focus">
                      <AccordionTrigger>Focus and keyboard states</AccordionTrigger>
                      <AccordionContent>
                        Tab through buttons, select menus, and the slider to check ring styles and
                        interaction parity across light and dark themes.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="overlay">
                      <AccordionTrigger>Overlay rendering</AccordionTrigger>
                      <AccordionContent>
                        Open the dialog and fire a toast to verify portal rendering and z-index
                        behavior from the package components.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                      <AccordionTrigger>Layout resilience</AccordionTrigger>
                      <AccordionContent>
                        Resize the viewport to ensure cards, tabs, and form controls stay usable on
                        smaller screens.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="inventory" className="pt-4">
                  <div className={glassPanelClass}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {releaseRows.map((row) => (
                          <TableRow key={row.packageName}>
                            <TableCell className="font-medium">{row.packageName}</TableCell>
                            <TableCell>{row.version}</TableCell>
                            <TableCell>{row.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle>Chart container</CardTitle>
              <CardDescription>Recharts rendered through the shared chart wrapper.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="min-h-72" config={chartConfig}>
                <AreaChart data={deliveryMetrics} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="sprint" tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="adoption"
                    stroke="var(--color-adoption)"
                    fill="var(--color-adoption)"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="var(--color-quality)"
                    fill="var(--color-quality)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle>Menus and assistive UI</CardTitle>
              <CardDescription>
                Coverage for dropdown menus, tooltips, hover cards, and keyboard hints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TooltipProvider>
                <div className="flex flex-wrap gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Open menu</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Release sharing</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={runVisualReview}
                        onCheckedChange={(checked) => setRunVisualReview(checked === true)}
                      >
                        Visual review
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={shareWithOps}
                        onCheckedChange={(checked) => setShareWithOps(checked === true)}
                      >
                        Notify ops
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => toast.success("Release note copied")}>
                        Copy release note
                        <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Archive preview
                        <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary">Tooltip target</Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={8}>
                      Press <Kbd>Shift</Kbd> to keep the selection range pinned.
                    </TooltipContent>
                  </Tooltip>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost">Hover card</Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>MB</AvatarFallback>
                          <AvatarBadge>
                            <BellIcon className="size-2" />
                          </AvatarBadge>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Moritz Brantner</p>
                          <p className="text-xs text-muted-foreground">
                            Package maintainer · ships UI updates on Fridays
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Hover cards are useful for quick metadata without forcing a click path or
                        another modal state.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>

                <div className={`${glassPanelClass} space-y-4 p-4`}>
                  <p className="text-sm font-medium">Why these matter</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The original gallery missed menu and assistive primitives, which made it easy to
                    regress overlay sizing, hover timing, and text contrast.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">Dropdown</Badge>
                    <Badge variant="secondary">Tooltip</Badge>
                    <Badge variant="secondary">Hover card</Badge>
                    <Badge variant="secondary">Kbd</Badge>
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle>States and identity</CardTitle>
              <CardDescription>
                Added the components that were still missing for empty states, alerts, breadcrumbs,
                loading, and avatars.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/index.html">Playground</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRightIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/ui.html">UI package</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRightIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Glass refresh</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className={`${glassPanelClass} flex items-center justify-between gap-4 p-4`}>
                <div>
                  <p className="text-sm font-medium">Maintainers</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Avatar groups help validate overlap, badges, and small-size rendering.
                  </p>
                </div>
                <AvatarGroup>
                  <Avatar>
                    <AvatarFallback>MB</AvatarFallback>
                    <AvatarBadge />
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>AR</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>LK</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+2</AvatarGroupCount>
                </AvatarGroup>
              </div>

              <Alert>
                <AlertTriangleIcon />
                <AlertTitle>Release freeze window</AlertTitle>
                <AlertDescription>
                  The gallery now covers alerts, empty states, and loading placeholders so state
                  transitions are visible while editing the package.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 lg:grid-cols-[0.48fr_0.52fr]">
                <div className={`${glassTileClass} space-y-3 p-4`}>
                  <p className="text-sm font-medium">Loading skeletons</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Spinner />
                    <DotsSpinner label="Loading previews" />
                    <span>Preparing previews</span>
                  </div>
                  <LoadingBar indeterminate label="Preview loading" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>

                <Empty className={`${glassTileClass} min-h-60 justify-center border-dashed`}>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderSearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>No package notes yet</EmptyTitle>
                    <EmptyDescription>
                      Empty states were absent from the previous page, so there was no place to
                      validate spacing, icon framing, or call-to-action balance.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline">
                      <SparklesIcon />
                      Create release note
                    </Button>
                  </EmptyContent>
                </Empty>
              </div>
            </CardContent>
          </Card>
        </section>
      </PlaygroundPage>
    </UiTheme>
  );
}

mountPage(<UiPage />);
