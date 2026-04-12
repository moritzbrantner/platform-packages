import { useMemo, useState } from "react";

import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  XAxis,
} from "recharts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
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
  type CalendarCellComponentProps,
  type CalendarIcsData,
} from "@moritzbrantner/ui";

import { PlaygroundPage } from "./app-shell";
import { mountPage } from "./mount";

const deliveryMetrics = [
  { sprint: "S1", adoption: 18, quality: 72 },
  { sprint: "S2", adoption: 31, quality: 79 },
  { sprint: "S3", adoption: 48, quality: 84 },
  { sprint: "S4", adoption: 65, quality: 90 },
] as const;

const releaseRows = [
  { packageName: "@moritzbrantner/ui", version: "0.2.0", status: "Current" },
  { packageName: "@moritzbrantner/storytelling", version: "0.1.0", status: "Preview" },
  { packageName: "@moritzbrantner/eslint-config", version: "0.1.0", status: "Infra" },
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
      className="h-full min-h-40 cursor-pointer items-stretch gap-3 rounded-[1.35rem] border border-border/60 bg-background/90 p-3 shadow-sm shadow-black/5 transition hover:border-border hover:bg-accent/10 data-[selected-single=true]:border-primary data-[selected-single=true]:bg-accent/15 data-[selected-single=true]:shadow-md"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="block text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {props.day.date.toLocaleDateString("en-US", { weekday: "short" })}
          </span>
          <span className="block text-2xl font-semibold leading-none">{children}</span>
        </div>
        {events.length > 0 ? (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-medium text-accent-foreground">
            {events.length} event{events.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-1 flex-col gap-2">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <div
              key={`${event.uid ?? event.summary ?? "event"}-${event.start.toISOString()}`}
              className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2"
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
          <div className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(64);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [density, setDensity] = useState("comfortable");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | undefined>(
    new Date(2026, 3, 14),
  );

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
    <PlaygroundPage
      activePage="ui"
      title="UI package examples"
      description="A compact gallery of interactive primitives rendered from the package exports. Use it to validate states, overlays, data display, and theme behavior while editing the package."
    >
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Actions and feedback</CardTitle>
                <CardDescription>Exercise buttons, badges, dialogs, toasts, and progress updates.</CardDescription>
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
                      This modal is rendered from the shared dialog primitive, so it
                      verifies focus handling, portal rendering, and package styling.
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

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Forms and selection</CardTitle>
            <CardDescription>Mix inputs, toggles, radio groups, and select menus.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="release-name">Release name</FieldLabel>
                <FieldContent>
                  <Input id="release-name" placeholder="Spring package refresh" />
                  <FieldDescription>Use this field to check focus and disabled styling.</FieldDescription>
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
                <Switch
                  id="alerts"
                  checked={alertsEnabled}
                  onCheckedChange={setAlertsEnabled}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel>Density</FieldLabel>
                <RadioGroup value={density} onValueChange={setDensity} className="grid-cols-3">
                  {["compact", "comfortable", "spacious"].map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
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
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5 xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Calendar preview</CardTitle>
                <CardDescription>
                  The calendar accepts jCal-style JSON, extracts `VEVENT`s, and renders the
                  daily schedule directly inside the day cells.
                </CardDescription>
              </div>
              <Badge variant="outline">ICS JSON</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-full rounded-2xl border border-border/60 bg-background/70 p-3">
              <Calendar
                cellComponent={CalendarPreviewDay}
                icsData={releaseCalendarData}
                defaultMonth={new Date(2026, 3, 1)}
                maxEventsPerDay={3}
                mode="single"
                selected={selectedCalendarDay}
                showOutsideDays={false}
                onSelect={setSelectedCalendarDay}
                className="w-full rounded-[2rem] border border-border/60 bg-background/90 p-4 [--cell-size:10rem]"
                classNames={{
                  root: "w-full",
                  months: "w-full",
                  month: "relative w-full gap-5 pt-14",
                  nav: "absolute inset-x-4 top-4 z-10 flex items-center justify-between",
                  button_previous:
                    "inline-flex size-10 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm",
                  button_next:
                    "inline-flex size-10 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm",
                  month_caption: "mb-2 min-h-10 px-20 text-lg",
                  caption_label: "text-lg font-semibold",
                  table: "w-full border-separate [border-spacing:0.6rem]",
                  weekdays: "grid grid-cols-7 gap-2",
                  weekday:
                    "flex h-10 items-center rounded-xl bg-muted/35 px-3 text-left text-xs font-semibold uppercase tracking-[0.18em]",
                  week: "mt-0 grid grid-cols-7 gap-2",
                  day: "min-h-40 rounded-[1.35rem] bg-muted/15",
                  today: "rounded-[1.35rem] bg-accent/20 text-foreground",
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Visible event coverage</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  April 14 carries two timed sessions, and April 20 to 22 shows a multi-day
                  release window sourced from a `date` range, matching all-day ICS semantics.
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Click any day card to move the selection state through the month.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Input shape</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The preview feeds `Calendar` a `vcalendar` tuple with nested `vevent`
                  tuples, so the example stays close to the JSON form of an `.ics` payload.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Composable navigation patterns</CardTitle>
            <CardDescription>Tabs hold an accordion and a package table so you can test layered primitives together.</CardDescription>
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
                      Tab through buttons, select menus, and the slider to check ring
                      styles and interaction parity across light and dark themes.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="overlay">
                    <AccordionTrigger>Overlay rendering</AccordionTrigger>
                    <AccordionContent>
                      Open the dialog and fire a toast to verify portal rendering and
                      z-index behavior from the package components.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="layout">
                    <AccordionTrigger>Layout resilience</AccordionTrigger>
                    <AccordionContent>
                      Resize the viewport to ensure cards, tabs, and form controls stay
                      usable on smaller screens.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="inventory" className="pt-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/60 bg-background/80 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Chart container</CardTitle>
            <CardDescription>Recharts rendered through the shared chart wrapper.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="min-h-72"
              config={chartConfig}
            >
              <AreaChart data={deliveryMetrics} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="sprint"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
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
    </PlaygroundPage>
  );
}

mountPage(<UiPage />);
