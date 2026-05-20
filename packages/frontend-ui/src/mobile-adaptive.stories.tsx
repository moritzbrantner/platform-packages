import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterIcon, MoreHorizontalIcon, PanelRightIcon, SendIcon } from "lucide-react";

import { Badge, Button, Input, Textarea } from "@moritzbrantner/ui";

import {
  AdaptiveDashboardScreen,
  AdaptiveDetailScreen,
  AdaptiveFormScreen,
  AdaptiveWorkbenchScreen,
  MobileCompanionPanel,
  MobileOverflowPanel,
  MobileToolbar,
} from "./index";

const mobileViewports = {
  mobile390: {
    name: "Mobile 390",
    styles: {
      width: "390px",
      height: "844px",
    },
  },
  mobile430: {
    name: "Mobile 430",
    styles: {
      width: "430px",
      height: "932px",
    },
  },
  tablet768: {
    name: "Tablet 768",
    styles: {
      width: "768px",
      height: "1024px",
    },
  },
} as const;

const meta = {
  title: "Storybook/Mobile/Adaptive Screens",
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: mobileViewports,
      defaultViewport: "mobile390",
    },
    a11y: {
      test: "todo",
    },
  },
  tags: ["autodocs", "test"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  render: () => (
    <AdaptiveDashboardScreen
      eyebrow={<Badge variant="outline">Today</Badge>}
      title="Review queue"
      description="A shared dashboard that keeps actions reachable on narrow screens."
      primaryAction={<Button>New review</Button>}
      secondaryActions={<Button variant="outline">Export</Button>}
      summary={
        <div className="grid gap-3 rounded-lg border bg-muted/25 p-4 text-sm sm:grid-cols-3">
          <strong>18 open</strong>
          <span>6 assigned</span>
          <span>3 blocked</span>
        </div>
      }
      mobileNavigation={
        <MobileToolbar label="Queue filters">
          <Button type="button" size="sm" variant="outline">
            Open
          </Button>
          <Button type="button" size="sm" variant="outline">
            Assigned
          </Button>
          <MobileOverflowPanel
            title="Queue filters"
            description="Compact controls for the current review queue."
            trigger={
              <Button type="button" size="sm" variant="outline">
                <FilterIcon />
                Filters
              </Button>
            }
          >
            <div className="grid gap-3">
              <Button type="button" variant="outline">
                Only blockers
              </Button>
              <Button type="button" variant="outline">
                Due this week
              </Button>
            </div>
          </MobileOverflowPanel>
        </MobileToolbar>
      }
      mobileBottomActions={<Button>Review next</Button>}
      sections={[
        {
          id: "activity",
          title: "Activity",
          content: <p className="text-sm text-muted-foreground">Five updates need attention.</p>,
        },
      ]}
      sidebar={<aside className="rounded-lg border bg-muted/20 p-4 text-sm">Queue health</aside>}
    />
  ),
};

export const DetailSidebarToPanel: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile430",
    },
  },
  render: () => (
    <AdaptiveDetailScreen
      title="Ticket MB-42"
      description="The desktop sidebar becomes mobile companion content."
      mobileTrailing={
        <MobileCompanionPanel
          title="Related records"
          trigger={
            <Button type="button" size="icon-sm" variant="outline">
              <PanelRightIcon />
              <span className="sr-only">Open related records</span>
            </Button>
          }
          companion={
            <div className="grid gap-2 text-sm">
              <p>Customer: Atlas GmbH</p>
              <p>Priority: High</p>
              <p>Owner: Mira</p>
            </div>
          }
        />
      }
      sections={[
        {
          id: "timeline",
          title: "Timeline",
          content: <p className="text-sm text-muted-foreground">Last reply was 14 minutes ago.</p>,
        },
      ]}
      sidebar={
        <aside className="rounded-lg border bg-muted/20 p-4 text-sm">
          Customer, priority, and owner details.
        </aside>
      }
    />
  ),
};

export const FormWithStickySubmit: Story = {
  render: () => (
    <AdaptiveFormScreen
      title="Create account"
      description="Submit actions stay in the safe-area-aware mobile footer."
      mobileBottomActions={
        <>
          <Button variant="outline">Save draft</Button>
          <Button>Create account</Button>
        </>
      }
      sections={[
        {
          id: "account",
          content: (
            <div className="grid gap-3">
              <Input aria-label="Display name" placeholder="Display name" />
              <Input aria-label="Work email" placeholder="Work email" />
            </div>
          ),
        },
      ]}
    />
  ),
};

export const WorkbenchComposer: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet768",
    },
  },
  render: () => (
    <AdaptiveWorkbenchScreen
      title="Chat with Jordan Ellis"
      description="Workbench sections reuse the same thread data on desktop and mobile."
      mobileTrailing={
        <Button type="button" size="icon-sm" variant="ghost">
          <MoreHorizontalIcon />
          <span className="sr-only">More actions</span>
        </Button>
      }
      mobileComposer={
        <div className="grid w-full grid-cols-[1fr_auto] gap-2">
          <Textarea aria-label="Message" className="min-h-10" placeholder="Message" />
          <Button type="button" size="icon">
            <SendIcon />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      }
      sections={[
        {
          id: "messages",
          content: (
            <div className="grid gap-3 text-sm">
              <p className="rounded-lg bg-muted/45 p-3">Can you review the mobile template?</p>
              <p className="rounded-lg bg-primary p-3 text-primary-foreground">On it.</p>
            </div>
          ),
        },
      ]}
      sidebar={<aside className="rounded-lg border bg-muted/20 p-4 text-sm">Thread notes</aside>}
    />
  ),
};
