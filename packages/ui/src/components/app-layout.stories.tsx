import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import {
  ActionBar,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageShell,
  PageTitle,
  SectionGrid,
  Surface,
  SurfaceAction,
  SurfaceContent,
  SurfaceDescription,
  SurfaceFooter,
  SurfaceHeader,
  SurfaceTitle,
} from "./app-layout";
import { Badge } from "./badge";
import { Button } from "./button";
import { Stat, StatDelta, StatDescription, StatGroup, StatLabel, StatValue } from "./stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

type DashboardDemoProps = {
  onRefresh?: () => void;
};

const releaseRows = [
  { name: "@moritzbrantner/ui", status: "Ready", owner: "Design system" },
  { name: "@moritzbrantner/maps", status: "Review", owner: "Geo tools" },
  { name: "@moritzbrantner/storytelling", status: "Preview", owner: "Media" },
] as const;

function DashboardDemo({ onRefresh = () => undefined }: DashboardDemoProps) {
  return (
    <PageShell background="muted" maxWidth="wide">
      <PageHeader>
        <div className="grid gap-2">
          <Badge variant="outline" className="w-fit">
            Platform
          </Badge>
          <PageTitle>Package operations</PageTitle>
          <PageDescription>
            Monitor package readiness, active reviews, and follow-up work across the shared platform
            workspace.
          </PageDescription>
        </div>
        <PageActions>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Button>New release</Button>
        </PageActions>
      </PageHeader>

      <PageContent>
        <StatGroup>
          <Stat>
            <StatLabel>Ready packages</StatLabel>
            <StatValue>18</StatValue>
            <StatDelta variant="positive">+4 this week</StatDelta>
          </Stat>
          <Stat>
            <StatLabel>Open reviews</StatLabel>
            <StatValue>6</StatValue>
            <StatDescription>Two need design review.</StatDescription>
          </Stat>
          <Stat>
            <StatLabel>Release confidence</StatLabel>
            <StatValue>92%</StatValue>
            <StatDelta>Stable</StatDelta>
          </Stat>
        </StatGroup>

        <SectionGrid columns="sidebar-right">
          <Surface>
            <SurfaceHeader>
              <div>
                <SurfaceTitle>Release queue</SurfaceTitle>
                <SurfaceDescription>Packages currently staged for verification.</SurfaceDescription>
              </div>
              <SurfaceAction>
                <Badge variant="secondary">3 items</Badge>
              </SurfaceAction>
            </SurfaceHeader>
            <SurfaceContent className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {releaseRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SurfaceContent>
          </Surface>

          <Surface variant="muted">
            <SurfaceHeader>
              <SurfaceTitle>Review focus</SurfaceTitle>
              <SurfaceDescription>
                Keep interactive examples and typed exports aligned before the next publish.
              </SurfaceDescription>
            </SurfaceHeader>
            <SurfaceContent className="mt-4 grid gap-3">
              <Badge className="w-fit">Storybook</Badge>
              <Badge variant="outline" className="w-fit">
                Type checks
              </Badge>
              <Badge variant="secondary" className="w-fit">
                Smoke tests
              </Badge>
            </SurfaceContent>
            <SurfaceFooter>
              <Button size="sm" variant="outline">
                View checklist
              </Button>
            </SurfaceFooter>
          </Surface>
        </SectionGrid>
      </PageContent>
    </PageShell>
  );
}

const meta = {
  title: "Layouts/App Shell",
  component: DashboardDemo,
  tags: ["autodocs", "test"],
  args: {
    onRefresh: fn(),
  },
} satisfies Meta<typeof DashboardDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DashboardPage: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));

    await expect(args.onRefresh).toHaveBeenCalledTimes(1);
  },
};

export const CenteredHeader: Story = {
  render: () => (
    <PageShell background="none" maxWidth="default">
      <PageHeader align="center">
        <Badge variant="outline">Preview</Badge>
        <PageTitle>Centered launch page</PageTitle>
        <PageDescription>
          A compact page header for focused empty states, onboarding screens, and feature previews.
        </PageDescription>
        <PageActions>
          <Button>Start review</Button>
          <Button variant="outline">Open docs</Button>
        </PageActions>
      </PageHeader>
    </PageShell>
  ),
};

export const SurfaceVariants: Story = {
  render: () => (
    <PageShell background="muted">
      <SectionGrid columns="three">
        {(["default", "muted", "transparent"] as const).map((variant) => (
          <Surface key={variant} variant={variant}>
            <SurfaceHeader>
              <SurfaceTitle className="capitalize">{variant}</SurfaceTitle>
              <SurfaceDescription>Surface styling for reusable page sections.</SurfaceDescription>
            </SurfaceHeader>
            <SurfaceContent className="mt-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Use this variant where the surrounding page needs a distinct panel treatment.
              </p>
            </SurfaceContent>
          </Surface>
        ))}
      </SectionGrid>
    </PageShell>
  ),
};

export const StickyActionBar: Story = {
  render: () => (
    <PageShell background="none" maxWidth="default">
      <Surface>
        <SurfaceHeader>
          <SurfaceTitle>Release settings</SurfaceTitle>
          <SurfaceDescription>
            Sticky actions remain available after a long form or review panel.
          </SurfaceDescription>
        </SurfaceHeader>
        <SurfaceContent className="mt-4 grid gap-3">
          {["Package metadata", "Visual review", "Compatibility notes"].map((item) => (
            <div key={item} className="border border-border/60 bg-muted/25 p-3">
              {item}
            </div>
          ))}
        </SurfaceContent>
        <SurfaceFooter>
          <ActionBar sticky className="w-full">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </ActionBar>
        </SurfaceFooter>
      </Surface>
    </PageShell>
  ),
};
