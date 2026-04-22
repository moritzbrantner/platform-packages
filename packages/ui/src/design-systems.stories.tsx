import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActivityIcon,
  ArrowRightIcon,
  BarChart3Icon,
  FileTextIcon,
  ImageIcon,
  Layers3Icon,
  PaletteIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "./components/badge";
import { Button } from "./components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
import { Input } from "./components/input";
import { Progress } from "./components/progress";
import { Separator } from "./components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
import { UiTheme, type UiThemeName } from "./themes";

type SystemProfile = {
  id: UiThemeName;
  name: string;
  label: string;
  description: string;
  surface: string;
  density: string;
  bestFor: string[];
  icon: typeof Layers3Icon;
};

const systems = [
  {
    id: "bobba",
    name: "Bobba",
    label: "Default package style",
    description: "Neutral, rounded, and product-safe for general platform applications.",
    surface: "Clean surfaces with moderate radius",
    density: "Balanced spacing",
    bestFor: ["Shared apps", "Admin flows", "Core components"],
    icon: Layers3Icon,
  },
  {
    id: "zleek",
    name: "Zleek",
    label: "Glass interface style",
    description: "Sharper translucent surfaces for polished application shells and launch tools.",
    surface: "Glass effects with strong depth",
    density: "Medium spacing",
    bestFor: ["Command centers", "Launch screens", "Presentation surfaces"],
    icon: PaletteIcon,
  },
  {
    id: "atlas",
    name: "Atlas",
    label: "Dense dashboard style",
    description: "Crisp, compact, and data-forward for maps, tables, charts, and analytics.",
    surface: "Flat data panels with tighter controls",
    density: "High density",
    bestFor: ["Maps", "Tables", "Operational dashboards"],
    icon: BarChart3Icon,
  },
  {
    id: "studio",
    name: "Studio",
    label: "Creative tooling style",
    description: "Expressive color and stronger emphasis for media and generation workflows.",
    surface: "Vivid panels with creative accents",
    density: "Medium spacing",
    bestFor: ["Media tools", "Storytelling", "Image and video workflows"],
    icon: ImageIcon,
  },
  {
    id: "paper",
    name: "Paper",
    label: "Document and research style",
    description: "Serif-led, document-like surfaces for reading, OCR, text, and research tools.",
    surface: "Paper texture with quiet controls",
    density: "Reading density",
    bestFor: ["OCR", "Linguistics", "Translation and text tools"],
    icon: FileTextIcon,
  },
] as const satisfies readonly SystemProfile[];

const meta = {
  title: "Design Systems/Overview",
  tags: ["autodocs", "test"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bobba: Story = {
  globals: { designSystem: "bobba" },
  render: () => <DesignSystemShowcase systemId="bobba" />,
};

export const Zleek: Story = {
  globals: { designSystem: "zleek" },
  render: () => <DesignSystemShowcase systemId="zleek" />,
};

export const Atlas: Story = {
  globals: { designSystem: "atlas" },
  render: () => <DesignSystemShowcase systemId="atlas" />,
};

export const Studio: Story = {
  globals: { designSystem: "studio" },
  render: () => <DesignSystemShowcase systemId="studio" />,
};

export const Paper: Story = {
  globals: { designSystem: "paper" },
  parameters: {
    a11y: {
      test: "todo",
    },
  },
  render: () => <DesignSystemShowcase systemId="paper" />,
};

function DesignSystemShowcase({ systemId }: { systemId: UiThemeName }) {
  const system = systems.find((item) => item.id === systemId) ?? systems[0];
  const Icon = system.icon;

  return (
    <UiTheme theme={system.id} className="min-h-screen bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-center gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{system.label}</Badge>
              <Badge variant="outline">{system.density}</Badge>
            </div>
            <div className="grid gap-3">
              <h1 className="text-4xl font-semibold tracking-normal lg:text-5xl">{system.name}</h1>
              <p className="max-w-3xl text-lg text-muted-foreground">{system.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {system.bestFor.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>
                <Icon />
                Primary action
              </Button>
              <Button variant="secondary">
                Review system
                <ArrowRightIcon />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System profile</CardTitle>
              <CardDescription>{system.surface}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <TokenSwatches />
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} aria-label="System profile completion" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ComponentPreview />
          <DataPreview />
        </section>
      </main>
    </UiTheme>
  );
}

function TokenSwatches() {
  const tokens = [
    ["Background", "var(--background)", "var(--foreground)"],
    ["Primary", "var(--primary)", "var(--primary-foreground)"],
    ["Secondary", "var(--secondary)", "var(--secondary-foreground)"],
    ["Accent", "var(--accent)", "var(--accent-foreground)"],
    ["Muted", "var(--muted)", "var(--muted-foreground)"],
    ["Card", "var(--card)", "var(--card-foreground)"],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {tokens.map(([label, background, foreground]) => (
        <div
          key={label}
          className="flex h-20 items-end rounded-md border p-3 text-sm font-medium"
          style={{ background, color: foreground }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function ComponentPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls and surfaces</CardTitle>
        <CardDescription>Buttons, inputs, tabs, badges, and interactive states.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="grid gap-5">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="states">States</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input aria-label="Search projects" placeholder="Search projects" />
              <Button variant="outline">
                <SearchIcon />
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </TabsContent>
          <TabsContent value="controls" className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Active jobs" value="24" />
              <Metric label="Review queue" value="8" />
              <Metric label="Passed" value="96%" />
            </div>
          </TabsContent>
          <TabsContent value="states" className="flex flex-wrap gap-3">
            <Badge>Ready</Badge>
            <Badge variant="secondary">Queued</Badge>
            <Badge variant="outline">Draft</Badge>
            <Badge variant="destructive">Blocked</Badge>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button size="sm">
          <ActivityIcon />
          Run check
        </Button>
      </CardFooter>
    </Card>
  );
}

function DataPreview() {
  const rows = [
    ["Maps", "Atlas", "Dense"],
    ["Media editor", "Studio", "Creative"],
    ["OCR", "Paper", "Research"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data and product patterns</CardTitle>
        <CardDescription>Shared tokens across tabular, status, and workflow UI.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([name, system, mode]) => (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell>{system}</TableCell>
                <TableCell>{mode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="grid gap-3">
          {[64, 42, 88].map((value, index) => (
            <div key={value} className="grid grid-cols-[72px_1fr_44px] items-center gap-3 text-sm">
              <span className="text-muted-foreground">Signal {index + 1}</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
              </div>
              <span className="text-right font-medium">{value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4 text-card-foreground">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
