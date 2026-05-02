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
  AvatarCollection,
  AvatarFallback,
  AvatarRoot,
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
  ComponentEditorPanel,
  ComponentEditorPreviewFrame,
  ComponentEditorProvider,
  ConnectionStatus,
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
  EditableComponent,
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
  LanguageSwitcher,
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
  ThemeModeSwitch,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UiTheme,
  buildJsxSnippet,
  type CalendarCellComponentProps,
  type ComponentEditableValue,
  type EditableComponentDefinition,
  type ThemeMode,
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
const themeStylesheetElementId = "platform-playground-theme-stylesheet";

const uiStyleOptions = [
  {
    value: "bobba",
    label: "Bobba",
    description: "Default package UI style",
  },
  {
    value: "zleek",
    label: "Zleek",
    description: "Sharper Zleek package style",
  },
  {
    value: "atlas",
    label: "Atlas",
    description: "Dense dashboard and data style",
  },
  {
    value: "studio",
    label: "Studio",
    description: "Creative tooling and media style",
  },
  {
    value: "paper",
    label: "Paper",
    description: "Document and research style",
  },
] as const satisfies ReadonlyArray<{
  value: UiThemeName;
  label: string;
  description: string;
}>;

const uiStyleLoaders = {
  zleek: () => import("@moritzbrantner/ui/zleek/styles.css?inline"),
  atlas: () => import("@moritzbrantner/ui/atlas/styles.css?inline"),
  studio: () => import("@moritzbrantner/ui/studio/styles.css?inline"),
  paper: () => import("@moritzbrantner/ui/paper/styles.css?inline"),
} as const satisfies Record<Exclude<UiThemeName, "bobba">, () => Promise<{ default: string }>>;

function isUiThemeName(value: string | null): value is UiThemeName {
  return (
    value === "bobba" ||
    value === "zleek" ||
    value === "atlas" ||
    value === "studio" ||
    value === "paper"
  );
}

function getInitialUiStyle(): UiThemeName {
  if (typeof window === "undefined") {
    return "bobba";
  }

  const storedStyle = window.localStorage.getItem(uiStyleStorageKey);
  return isUiThemeName(storedStyle) ? storedStyle : "bobba";
}

function getInitialThemeMode(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function usePlaygroundUiStyle(style: UiThemeName) {
  useEffect(() => {
    let cancelled = false;

    window.localStorage.setItem(uiStyleStorageKey, style);
    document.documentElement.dataset.uiStyle = style;

    const existingStyleElement = document.getElementById(
      themeStylesheetElementId,
    ) as HTMLStyleElement | null;

    if (style === "bobba") {
      existingStyleElement?.remove();

      return () => {
        delete document.documentElement.dataset.uiStyle;
      };
    }

    const styleElement = existingStyleElement ?? document.createElement("style");
    styleElement.id = themeStylesheetElementId;

    if (!existingStyleElement) {
      document.head.append(styleElement);
    }

    void uiStyleLoaders[style]().then(({ default: stylesheetCss }) => {
      if (!cancelled) {
        styleElement.textContent = stylesheetCss;
      }
    });

    return () => {
      cancelled = true;
      styleElement.remove();
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
    packageName: "@moritzbrantner/oxfmt-config",
    version: "0.1.1",
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

type EditorValues = Record<string, ComponentEditableValue>;

type EditableGalleryItem = {
  definition: EditableComponentDefinition;
  render: (values: EditorValues) => React.ReactNode;
};

function getEditorString(values: EditorValues, key: string) {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

function getEditorNumber(values: EditorValues, key: string) {
  const value = values[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function getEditorBoolean(values: EditorValues, key: string) {
  return values[key] === true;
}

function mergeEditorClassName(baseClassName: string, values: EditorValues) {
  return [baseClassName, getEditorString(values, "className")].filter(Boolean).join(" ");
}

function buildButtonSnippet(values: EditorValues) {
  const styleColor = getEditorString(values, "backgroundColor");
  const styleProp = styleColor ? ` style={{ backgroundColor: "${styleColor}" }}` : "";
  const className = getEditorString(values, "className");
  const props = [
    `variant="${getEditorString(values, "variant")}"`,
    `size="${getEditorString(values, "size")}"`,
    getEditorBoolean(values, "disabled") ? "disabled" : "",
    className ? `className="${className}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `import { Button } from "@moritzbrantner/ui";\n\n<Button ${props}${styleProp}>\n  ${getEditorString(
    values,
    "label",
  )}\n</Button>`;
}

function buildCardSnippet(values: EditorValues) {
  const imports = ["Card", "CardContent", "CardDescription", "CardHeader", "CardTitle"];
  const className = getEditorString(values, "className");
  const padding = getEditorNumber(values, "padding");

  return `import { ${imports.join(", ")} } from "@moritzbrantner/ui";\n\n<Card${
    className ? ` className="${className}"` : ""
  }>\n  <CardHeader>\n    <CardTitle>${getEditorString(
    values,
    "title",
  )}</CardTitle>\n    <CardDescription>${getEditorString(
    values,
    "description",
  )}</CardDescription>\n  </CardHeader>\n  <CardContent className="p-${padding}">\n    ${getEditorString(
    values,
    "content",
  )}\n  </CardContent>\n</Card>`;
}

function buildEditableGalleryItems(): EditableGalleryItem[] {
  return [
    {
      definition: {
        id: "editable-button",
        label: "Button",
        importName: "Button",
        importFrom: "@moritzbrantner/ui",
        controls: [
          {
            id: "variant",
            label: "Variant",
            type: "select",
            value: "default",
            options: ["default", "secondary", "outline", "ghost", "destructive"].map((value) => ({
              label: value,
              value,
            })),
          },
          {
            id: "size",
            label: "Size",
            type: "select",
            value: "default",
            options: ["default", "sm", "lg", "icon"].map((value) => ({ label: value, value })),
          },
          { id: "label", label: "Label", type: "text", value: "Save draft" },
          { id: "disabled", label: "Disabled", type: "boolean", value: false },
          { id: "backgroundColor", label: "Background color", type: "color", value: "" },
          { id: "className", label: "className", type: "className", value: "" },
        ],
        buildSnippet: buildButtonSnippet,
      },
      render: (values) => (
        <Button
          variant={
            getEditorString(values, "variant") as React.ComponentProps<typeof Button>["variant"]
          }
          size={getEditorString(values, "size") as React.ComponentProps<typeof Button>["size"]}
          disabled={getEditorBoolean(values, "disabled")}
          className={getEditorString(values, "className")}
          style={
            getEditorString(values, "backgroundColor")
              ? { backgroundColor: getEditorString(values, "backgroundColor") }
              : undefined
          }
        >
          {getEditorString(values, "label")}
        </Button>
      ),
    },
    {
      definition: {
        id: "editable-badge",
        label: "Badge",
        importName: "Badge",
        importFrom: "@moritzbrantner/ui",
        controls: [
          {
            id: "variant",
            label: "Variant",
            type: "select",
            value: "outline",
            options: ["default", "secondary", "destructive", "outline"].map((value) => ({
              label: value,
              value,
            })),
          },
          { id: "label", label: "Label", type: "text", value: "Preview" },
          { id: "className", label: "className", type: "className", value: "" },
        ],
        buildSnippet: (values) =>
          buildJsxSnippet({
            importName: "Badge",
            importFrom: "@moritzbrantner/ui",
            props: {
              variant: values.variant,
              className: values.className,
            },
            children: getEditorString(values, "label"),
          }),
      },
      render: (values) => (
        <Badge
          variant={
            getEditorString(values, "variant") as React.ComponentProps<typeof Badge>["variant"]
          }
          className={getEditorString(values, "className")}
        >
          {getEditorString(values, "label")}
        </Badge>
      ),
    },
    {
      definition: {
        id: "editable-card",
        label: "Card",
        importName: "Card",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "title", label: "Title", type: "text", value: "Release status" },
          {
            id: "description",
            label: "Description",
            type: "text",
            value: "Ready to integrate into a project.",
          },
          {
            id: "content",
            label: "Content",
            type: "textarea",
            value: "Copy the JSX and adapt it.",
          },
          {
            id: "padding",
            label: "Content padding",
            type: "slider",
            value: 4,
            min: 2,
            max: 8,
            step: 1,
          },
          { id: "className", label: "className", type: "className", value: "max-w-sm" },
        ],
        buildSnippet: buildCardSnippet,
      },
      render: (values) => (
        <Card className={mergeEditorClassName("max-w-sm", values)}>
          <CardHeader>
            <CardTitle>{getEditorString(values, "title")}</CardTitle>
            <CardDescription>{getEditorString(values, "description")}</CardDescription>
          </CardHeader>
          <CardContent style={{ padding: `${getEditorNumber(values, "padding") * 0.25}rem` }}>
            <p className="text-sm text-muted-foreground">{getEditorString(values, "content")}</p>
          </CardContent>
        </Card>
      ),
    },
    {
      definition: {
        id: "editable-progress",
        label: "Progress and LoadingBar",
        importName: "Progress",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "value", label: "Value", type: "slider", value: 64, min: 0, max: 100, step: 1 },
          { id: "showValue", label: "Show loading value", type: "boolean", value: true },
          {
            id: "size",
            label: "Loading bar size",
            type: "select",
            value: "sm",
            options: ["sm", "default", "lg"].map((value) => ({ label: value, value })),
          },
        ],
        buildSnippet: (values) =>
          `import { LoadingBar, Progress } from "@moritzbrantner/ui";\n\n<Progress value={${getEditorNumber(
            values,
            "value",
          )}} />\n<LoadingBar value={${getEditorNumber(values, "value")}} size="${getEditorString(
            values,
            "size",
          )}"${getEditorBoolean(values, "showValue") ? " showValue" : ""} />`,
      },
      render: (values) => (
        <div className="w-full max-w-md space-y-3">
          <Progress value={getEditorNumber(values, "value")} />
          <LoadingBar
            value={getEditorNumber(values, "value")}
            size={
              getEditorString(values, "size") as React.ComponentProps<typeof LoadingBar>["size"]
            }
            showValue={getEditorBoolean(values, "showValue")}
          />
        </div>
      ),
    },
    {
      definition: {
        id: "editable-slider",
        label: "Slider",
        importName: "Slider",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "value", label: "Value", type: "slider", value: 42, min: 0, max: 100, step: 1 },
          { id: "max", label: "Max", type: "number", value: 100 },
          { id: "step", label: "Step", type: "number", value: 1 },
        ],
        buildSnippet: (values) =>
          buildJsxSnippet({
            importName: "Slider",
            importFrom: "@moritzbrantner/ui",
            props: {
              value: [`${getEditorNumber(values, "value")}`],
              max: values.max,
              step: values.step,
            },
            selfClosing: true,
          }),
      },
      render: (values) => (
        <Slider
          className="max-w-md"
          value={[getEditorNumber(values, "value")]}
          max={getEditorNumber(values, "max")}
          step={getEditorNumber(values, "step")}
        />
      ),
    },
    {
      definition: {
        id: "editable-form-controls",
        label: "Input and Textarea",
        importName: "Input",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "placeholder", label: "Input placeholder", type: "text", value: "Project name" },
          {
            id: "notes",
            label: "Textarea content",
            type: "textarea",
            value: "Describe the component behavior you need.",
          },
          { id: "disabled", label: "Disabled", type: "boolean", value: false },
          { id: "className", label: "className", type: "className", value: "" },
        ],
        buildSnippet: (values) =>
          `import { Input, Textarea } from "@moritzbrantner/ui";\n\n<Input placeholder="${getEditorString(
            values,
            "placeholder",
          )}"${getEditorBoolean(values, "disabled") ? " disabled" : ""}${
            values.className ? ` className="${values.className}"` : ""
          } />\n<Textarea defaultValue="${getEditorString(values, "notes")}" />`,
      },
      render: (values) => (
        <div className="grid w-full max-w-md gap-3">
          <Input
            placeholder={getEditorString(values, "placeholder")}
            disabled={getEditorBoolean(values, "disabled")}
            className={getEditorString(values, "className")}
          />
          <Textarea
            defaultValue={getEditorString(values, "notes")}
            disabled={getEditorBoolean(values, "disabled")}
          />
        </div>
      ),
    },
    {
      definition: {
        id: "editable-switch-checkbox-radio",
        label: "Switch, Checkbox, and RadioGroup",
        importName: "Switch",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "enabled", label: "Switch enabled", type: "boolean", value: true },
          { id: "checked", label: "Checkbox checked", type: "boolean", value: true },
          {
            id: "density",
            label: "Radio value",
            type: "select",
            value: "comfortable",
            options: ["compact", "comfortable", "spacious"].map((value) => ({
              label: value,
              value,
            })),
          },
        ],
        buildSnippet: (values) =>
          `import { Checkbox, RadioGroup, RadioGroupItem, Switch } from "@moritzbrantner/ui";\n\n<Switch checked={${getEditorBoolean(
            values,
            "enabled",
          )}} />\n<Checkbox checked={${getEditorBoolean(values, "checked")}} />\n<RadioGroup value="${getEditorString(
            values,
            "density",
          )}">\n  <RadioGroupItem value="compact" />\n  <RadioGroupItem value="comfortable" />\n  <RadioGroupItem value="spacious" />\n</RadioGroup>`,
      },
      render: (values) => (
        <div className="grid gap-3 text-sm">
          <label className="flex items-center gap-2">
            <Switch checked={getEditorBoolean(values, "enabled")} />
            Notifications
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={getEditorBoolean(values, "checked")} />
            Include QA
          </label>
          <RadioGroup value={getEditorString(values, "density")} className="grid-cols-3">
            {["compact", "comfortable", "spacious"].map((value) => (
              <label key={value} className="flex items-center gap-2">
                <RadioGroupItem value={value} />
                {value}
              </label>
            ))}
          </RadioGroup>
        </div>
      ),
    },
    {
      definition: {
        id: "editable-alert",
        label: "Alert",
        importName: "Alert",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "title", label: "Title", type: "text", value: "Release freeze window" },
          {
            id: "description",
            label: "Description",
            type: "textarea",
            value: "Component changes need review before shipping.",
          },
          { id: "className", label: "className", type: "className", value: "" },
        ],
        buildSnippet: (values) =>
          `import { Alert, AlertDescription, AlertTitle } from "@moritzbrantner/ui";\n\n<Alert${
            values.className ? ` className="${values.className}"` : ""
          }>\n  <AlertTitle>${getEditorString(values, "title")}</AlertTitle>\n  <AlertDescription>${getEditorString(
            values,
            "description",
          )}</AlertDescription>\n</Alert>`,
      },
      render: (values) => (
        <Alert className={getEditorString(values, "className")}>
          <AlertTriangleIcon />
          <AlertTitle>{getEditorString(values, "title")}</AlertTitle>
          <AlertDescription>{getEditorString(values, "description")}</AlertDescription>
        </Alert>
      ),
    },
    {
      definition: {
        id: "editable-tabs",
        label: "Tabs and Accordion",
        importName: "Tabs",
        importFrom: "@moritzbrantner/ui",
        controls: [
          {
            id: "tab",
            label: "Active tab",
            type: "select",
            value: "notes",
            options: [
              { label: "Notes", value: "notes" },
              { label: "Inventory", value: "inventory" },
            ],
          },
          { id: "firstLabel", label: "First tab label", type: "text", value: "Release notes" },
          { id: "secondLabel", label: "Second tab label", type: "text", value: "Inventory" },
        ],
        buildSnippet: (values) =>
          `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@moritzbrantner/ui";\n\n<Tabs defaultValue="${getEditorString(
            values,
            "tab",
          )}">\n  <TabsList>\n    <TabsTrigger value="notes">${getEditorString(
            values,
            "firstLabel",
          )}</TabsTrigger>\n    <TabsTrigger value="inventory">${getEditorString(
            values,
            "secondLabel",
          )}</TabsTrigger>\n  </TabsList>\n  <TabsContent value="notes">Release note content</TabsContent>\n  <TabsContent value="inventory">Inventory content</TabsContent>\n</Tabs>`,
      },
      render: (values) => (
        <Tabs value={getEditorString(values, "tab")} className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="notes">{getEditorString(values, "firstLabel")}</TabsTrigger>
            <TabsTrigger value="inventory">{getEditorString(values, "secondLabel")}</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="pt-3">
            <Accordion type="single" collapsible>
              <AccordionItem value="focus">
                <AccordionTrigger>Focus and keyboard states</AccordionTrigger>
                <AccordionContent>Reusable tab content.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          <TabsContent value="inventory" className="pt-3">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>@moritzbrantner/ui</TableCell>
                  <TableCell>Current</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      ),
    },
    {
      definition: {
        id: "editable-calendar",
        label: "Calendar",
        importName: "Calendar",
        importFrom: "@moritzbrantner/ui",
        controls: [
          {
            id: "maxEventsPerDay",
            label: "Max events per day",
            type: "slider",
            value: 2,
            min: 1,
            max: 4,
            step: 1,
          },
          { id: "showOutsideDays", label: "Show outside days", type: "boolean", value: false },
          {
            id: "cellSize",
            label: "Cell size rem",
            type: "slider",
            value: 8,
            min: 5,
            max: 12,
            step: 1,
          },
        ],
        buildSnippet: (values) =>
          `import { Calendar } from "@moritzbrantner/ui";\n\n<Calendar\n  mode="single"\n  maxEventsPerDay={${getEditorNumber(
            values,
            "maxEventsPerDay",
          )}}\n  showOutsideDays={${getEditorBoolean(
            values,
            "showOutsideDays",
          )}}\n  className="[--cell-size:${getEditorNumber(values, "cellSize")}rem]"\n/>`,
      },
      render: (values) => (
        <Calendar
          cellComponent={CalendarPreviewDay}
          icsData={releaseCalendarData}
          defaultMonth={new Date(2026, 3, 1)}
          maxEventsPerDay={getEditorNumber(values, "maxEventsPerDay")}
          mode="single"
          selected={new Date(2026, 3, 14)}
          showOutsideDays={getEditorBoolean(values, "showOutsideDays")}
          className="w-full max-w-3xl rounded-none border border-border/60 bg-background/55 p-3"
          style={
            { "--cell-size": `${getEditorNumber(values, "cellSize")}rem` } as React.CSSProperties
          }
        />
      ),
    },
    {
      definition: {
        id: "editable-chart",
        label: "ChartContainer",
        importName: "ChartContainer",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "adoptionColor", label: "Adoption color", type: "color", value: "#2563eb" },
          { id: "qualityColor", label: "Quality color", type: "color", value: "#16a34a" },
          {
            id: "opacity",
            label: "Fill opacity",
            type: "slider",
            value: 18,
            min: 4,
            max: 40,
            step: 1,
          },
        ],
        buildSnippet: (values) =>
          `import { ChartContainer } from "@moritzbrantner/ui";\n\n<ChartContainer\n  config={{\n    adoption: { label: "Adoption", color: "${getEditorString(
            values,
            "adoptionColor",
          )}" },\n    quality: { label: "Quality", color: "${getEditorString(
            values,
            "qualityColor",
          )}" },\n  }}\n>\n  {/* Recharts chart */}\n</ChartContainer>`,
      },
      render: (values) => {
        const config = {
          adoption: { label: "Adoption", color: getEditorString(values, "adoptionColor") },
          quality: { label: "Quality", color: getEditorString(values, "qualityColor") },
        };

        return (
          <ChartContainer className="min-h-64 w-full max-w-md" config={config}>
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
                fillOpacity={getEditorNumber(values, "opacity") / 100}
              />
              <Area
                type="monotone"
                dataKey="quality"
                stroke="var(--color-quality)"
                fill="var(--color-quality)"
                fillOpacity={getEditorNumber(values, "opacity") / 100}
              />
            </AreaChart>
          </ChartContainer>
        );
      },
    },
    {
      definition: {
        id: "editable-identity-state",
        label: "AvatarCollection, ConnectionStatus, and Empty",
        importName: "AvatarCollection",
        importFrom: "@moritzbrantner/ui",
        controls: [
          {
            id: "maxVisible",
            label: "Max visible avatars",
            type: "slider",
            value: 3,
            min: 1,
            max: 5,
            step: 1,
          },
          { id: "emptyTitle", label: "Empty title", type: "text", value: "No package notes yet" },
          { id: "emptyAction", label: "Action label", type: "text", value: "Create release note" },
        ],
        buildSnippet: (values) =>
          `import { AvatarCollection, Button, ConnectionStatus, Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@moritzbrantner/ui";\n\n<AvatarCollection users={users} maxVisible={${getEditorNumber(
            values,
            "maxVisible",
          )}} />\n<ConnectionStatus status="synced" onSync={checkSync} />\n<Empty>\n  <EmptyHeader>\n    <EmptyTitle>${getEditorString(
            values,
            "emptyTitle",
          )}</EmptyTitle>\n  </EmptyHeader>\n  <EmptyContent>\n    <Button variant="outline">${getEditorString(
            values,
            "emptyAction",
          )}</Button>\n  </EmptyContent>\n</Empty>`,
      },
      render: (values) => (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid content-start gap-3">
            <AvatarCollection
              users={[
                { initials: "MB", name: "Moritz Brantner", online: true },
                { initials: "AR", name: "Ari Reed" },
                { initials: "LK", name: "Lena Koch" },
                { initials: "VT", name: "Vera Tran" },
                { initials: "PN", name: "Priya Nair" },
              ]}
              maxVisible={getEditorNumber(values, "maxVisible")}
            />
            <ConnectionStatus
              status="synced"
              onSync={() => toast.success("Connection is synced")}
            />
          </div>
          <Empty className="min-h-48 border border-dashed">
            <EmptyHeader>
              <EmptyTitle>{getEditorString(values, "emptyTitle")}</EmptyTitle>
              <EmptyDescription>
                State copy and actions can be adjusted before integration.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline">{getEditorString(values, "emptyAction")}</Button>
            </EmptyContent>
          </Empty>
        </div>
      ),
    },
    {
      definition: {
        id: "editable-overlays",
        label: "Dropdown, Tooltip, and HoverCard",
        importName: "DropdownMenu",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "menuLabel", label: "Menu button", type: "text", value: "Open menu" },
          {
            id: "tooltip",
            label: "Tooltip text",
            type: "text",
            value: "Keep the selection pinned.",
          },
          {
            id: "hoverTitle",
            label: "Hover card title",
            type: "text",
            value: "Package maintainer",
          },
        ],
        buildSnippet: (values) =>
          `import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipTrigger } from "@moritzbrantner/ui";\n\n<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <Button variant="outline">${getEditorString(
            values,
            "menuLabel",
          )}</Button>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Copy release note</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>\n<Tooltip>\n  <TooltipTrigger asChild>\n    <Button variant="secondary">Tooltip target</Button>\n  </TooltipTrigger>\n  <TooltipContent>${getEditorString(values, "tooltip")}</TooltipContent>\n</Tooltip>`,
      },
      render: (values) => (
        <TooltipProvider>
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{getEditorString(values, "menuLabel")}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Release sharing</DropdownMenuLabel>
                <DropdownMenuItem>Copy release note</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Tooltip target</Button>
              </TooltipTrigger>
              <TooltipContent>{getEditorString(values, "tooltip")}</TooltipContent>
            </Tooltip>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost">Hover card</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm font-medium">{getEditorString(values, "hoverTitle")}</p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </TooltipProvider>
      ),
    },
    {
      definition: {
        id: "editable-navigation-utilities",
        label: "Breadcrumb, Select, ToggleGroup, and Loading",
        importName: "Breadcrumb",
        importFrom: "@moritzbrantner/ui",
        controls: [
          { id: "page", label: "Breadcrumb page", type: "text", value: "UI package" },
          {
            id: "environment",
            label: "Selected environment",
            type: "select",
            value: "preview",
            options: ["local", "preview", "production"].map((value) => ({ label: value, value })),
          },
          {
            id: "layout",
            label: "Layout mode",
            type: "select",
            value: "grid",
            options: ["grid", "list"].map((value) => ({ label: value, value })),
          },
        ],
        buildSnippet: (values) =>
          `import { Breadcrumb, NativeSelect, ToggleGroup, ToggleGroupItem } from "@moritzbrantner/ui";\n\n<Breadcrumb>{/* ${getEditorString(
            values,
            "page",
          )} */}</Breadcrumb>\n<NativeSelect defaultValue="${getEditorString(
            values,
            "environment",
          )}" />\n<ToggleGroup type="single" value="${getEditorString(
            values,
            "layout",
          )}">\n  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>\n  <ToggleGroupItem value="list">List</ToggleGroupItem>\n</ToggleGroup>`,
      },
      render: (values) => (
        <div className="grid gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/index.html">Playground</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{getEditorString(values, "page")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-wrap gap-3">
            <NativeSelect className="w-44" value={getEditorString(values, "environment")}>
              <NativeSelectOption value="local">Local</NativeSelectOption>
              <NativeSelectOption value="preview">Preview</NativeSelectOption>
              <NativeSelectOption value="production">Production</NativeSelectOption>
            </NativeSelect>
            <ToggleGroup type="single" value={getEditorString(values, "layout")}>
              <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
            </ToggleGroup>
            <Spinner />
            <DotsSpinner label="Loading previews" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      ),
    },
  ];
}

function EditableIntegrationGallery() {
  const editableItems = useMemo(buildEditableGalleryItems, []);

  return (
    <ComponentEditorProvider defaultSelectedId="editable-button">
      <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className={glassCardClass}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Component editor</CardTitle>
                <CardDescription>
                  Select a component, adjust its props and styling, then copy JSX for your project.
                </CardDescription>
              </div>
              <Badge variant="outline">Click to edit</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-2">
              {editableItems.map((item) => (
                <EditableComponent
                  key={item.definition.id}
                  definition={item.definition}
                  className="min-h-full"
                >
                  {(values) => (
                    <ComponentEditorPreviewFrame
                      label={item.definition.label}
                      className="flex min-h-40 flex-col justify-center"
                    >
                      {item.render(values)}
                    </ComponentEditorPreviewFrame>
                  )}
                </EditableComponent>
              ))}
            </div>
          </CardContent>
        </Card>
        <ComponentEditorPanel className="sticky top-4 max-h-[calc(100vh-2rem)] xl:self-start" />
      </section>
    </ComponentEditorProvider>
  );
}

function UiPage() {
  const [uiStyle, setUiStyle] = useState<UiThemeName>(getInitialUiStyle);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(64);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [language, setLanguage] = useState("en");
  const [qaRequired, setQaRequired] = useState(true);
  const [runVisualReview, setRunVisualReview] = useState(true);
  const [shareWithOps, setShareWithOps] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | undefined>(
    new Date(2026, 3, 14),
  );
  usePlaygroundUiStyle(uiStyle);

  useEffect(() => {
    const root = document.documentElement;
    const hadDarkMode = root.classList.contains("dark");

    root.classList.toggle("dark", themeMode === "dark");

    return () => {
      root.classList.toggle("dark", hadDarkMode);
    };
  }, [themeMode]);

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
        <EditableIntegrationGallery />

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
                  <FieldLabel>Appearance</FieldLabel>
                  <ThemeModeSwitch mode={themeMode} onModeChange={setThemeMode} />
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel>Language</FieldLabel>
                  <LanguageSwitcher
                    value={language}
                    onValueChange={(nextLanguage) => setLanguage(nextLanguage)}
                  />
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
                        <AvatarRoot>
                          <AvatarFallback>MB</AvatarFallback>
                          <AvatarBadge>
                            <BellIcon className="size-2" />
                          </AvatarBadge>
                        </AvatarRoot>
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
                    Avatar collections help validate overlap, badges, and small-size rendering.
                  </p>
                </div>
                <AvatarCollection
                  users={[
                    { initials: "MB", name: "Moritz Brantner", online: true },
                    { initials: "AR", name: "Ari Reed" },
                    { initials: "LK", name: "Lena Koch" },
                    { initials: "VT", name: "Vera Tran" },
                    { initials: "PN", name: "Priya Nair" },
                  ]}
                  maxVisible={3}
                />
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
