import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import { Button, Toolbar, ToolbarGroup, ToolbarTitle } from "@moritzbrantner/ui";

import {
  AdaptiveDashboardScreen,
  AdaptiveDetailScreen,
  AdaptiveFormScreen,
  AdaptiveWorkbenchScreen,
  DashboardScreen,
  DetailScreen,
  FormScreen,
  MobileActionDock,
  MobileCompanionPanel,
  MobileDashboardScreen,
  MobileDetailScreen,
  MobileFormScreen,
  MobileOverflowPanel,
  MobileScreenShell,
  MobileStickyFooter,
  MobileToolbar,
  MobileWorkbenchScreen,
  PublicScreen,
  WorkbenchScreen,
} from "../..";

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("@moritzbrantner/frontend-ui screen templates", () => {
  test("renders public and form screens with shared header structure", () => {
    render(
      <>
        <PublicScreen
          eyebrow={<span>Public</span>}
          title="Landing"
          description="Public entry screen"
          primaryAction={<Button>Start</Button>}
          sections={[{ id: "overview", title: "Overview", content: <p>Overview content</p> }]}
        />
        <FormScreen
          title="Login"
          description="Sign in to continue"
          sections={[
            {
              id: "form",
              content: (
                <label htmlFor="email">
                  Email
                  <input id="email" />
                </label>
              ),
            },
          ]}
        />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Landing" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
    expect(screen.getByText("Overview content")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  test("renders dashboard, detail, and workbench screens with structured sections", () => {
    render(
      <>
        <DashboardScreen
          title="Home"
          description="Dashboard summary"
          toolbar={
            <Toolbar aria-label="Dashboard tools">
              <ToolbarGroup>
                <ToolbarTitle>Home tools</ToolbarTitle>
              </ToolbarGroup>
            </Toolbar>
          }
          sections={[{ id: "stats", title: "Stats", content: <p>42 ready</p> }]}
        />
        <DetailScreen
          title="Profile"
          sections={[{ id: "detail", title: "Profile data", content: <p>Mira Brandt</p> }]}
          sidebar={<aside>Sidebar notes</aside>}
        />
        <WorkbenchScreen
          title="Chat"
          sections={[{ id: "thread", title: "Thread", content: <p>Conversation</p> }]}
        />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Dashboard tools" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("Sidebar notes")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Chat" })).toBeTruthy();
  });

  test("renders mobile-specific screen templates with shared section data", () => {
    render(
      <>
        <MobileDashboardScreen
          eyebrow="Mobile"
          title="Today"
          description="Compact dashboard"
          navigation={<nav aria-label="Mobile tabs">Tabs</nav>}
          summary={<p>3 alerts</p>}
          sections={[{ id: "feed", title: "Feed", content: <p>Latest activity</p> }]}
          bottomActions={<Button>Review</Button>}
        />
        <MobileDetailScreen
          title="Ticket"
          sections={[{ id: "timeline", content: <p>Timeline entry</p> }]}
          companion={<aside>Related records</aside>}
        />
        <MobileFormScreen
          title="Account"
          sections={[
            {
              id: "account-form",
              content: (
                <label htmlFor="mobile-name">
                  Name
                  <input id="mobile-name" />
                </label>
              ),
            },
          ]}
        />
        <MobileWorkbenchScreen
          title="Thread"
          sections={[{ id: "messages", content: <p>Message history</p> }]}
          composer={<Button>Send</Button>}
        />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Mobile tabs" })).toBeTruthy();
    expect(screen.getByText("Latest activity")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ticket" })).toBeTruthy();
    expect(screen.getByText("Related records")).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Thread" })).toBeTruthy();
    expect(screen.getByText("Message history")).toBeTruthy();
  });

  test("renders low-level mobile primitives for custom mobile flows", () => {
    const { container } = render(
      <MobileScreenShell>
        <p>Custom shell content</p>
        <MobileActionDock>
          <Button>Continue</Button>
        </MobileActionDock>
      </MobileScreenShell>,
    );

    expect(screen.getByText("Custom shell content")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(container.querySelector('[data-slot="mobile-screen-shell"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="mobile-action-dock"]')).toBeTruthy();
  });

  test("supports full-width mobile shells and stacked action docks", () => {
    const { container } = render(
      <MobileScreenShell maxWidth="full">
        <MobileActionDock layout="stacked">
          <Button>Save</Button>
          <Button variant="outline">Cancel</Button>
        </MobileActionDock>
      </MobileScreenShell>,
    );

    const shell = container.querySelector('[data-slot="mobile-screen-shell"]');
    const dock = container.querySelector('[data-slot="mobile-action-dock"]');

    expect(shell?.getAttribute("data-max-width")).toBe("full");
    expect(shell?.className).toContain("max-w-none");
    expect(dock?.getAttribute("data-layout")).toBe("stacked");
    expect(dock?.querySelector("div")?.className).toContain("[&_[data-slot=button]]:w-full");
  });

  test("renders adaptive screens with mobile and desktop responsive regions", () => {
    const { container } = render(
      <>
        <AdaptiveDashboardScreen
          title="Adaptive home"
          description="Responsive dashboard"
          summary={<p>Desktop summary</p>}
          mobileSummary={<p>Mobile summary</p>}
          sections={[{ id: "dashboard", title: "Dashboard section", content: <p>Metrics</p> }]}
          sidebar={<aside>Dashboard sidebar</aside>}
          mobileBottomActions={<Button>Review queue</Button>}
        />
        <AdaptiveDetailScreen
          title="Adaptive detail"
          sections={[{ id: "detail", content: <p>Detail body</p> }]}
          sidebar={<aside>Detail sidebar</aside>}
        />
        <AdaptiveFormScreen
          title="Adaptive form"
          sections={[
            {
              id: "form",
              content: (
                <label htmlFor="adaptive-name">
                  Name
                  <input id="adaptive-name" />
                </label>
              ),
            },
          ]}
          mobileBottomActions={<Button>Submit</Button>}
        />
        <AdaptiveWorkbenchScreen
          title="Adaptive workbench"
          sections={[{ id: "workbench", content: <p>Thread body</p> }]}
          mobileComposer={<Button>Send message</Button>}
        />
      </>,
    );

    const mobileRegions = container.querySelectorAll('[data-slot="adaptive-screen-mobile"]');
    const desktopRegions = container.querySelectorAll('[data-slot="adaptive-screen-desktop"]');

    expect(mobileRegions).toHaveLength(4);
    expect(desktopRegions).toHaveLength(4);
    expect(mobileRegions[0]?.className).toContain("md:hidden");
    expect(desktopRegions[0]?.className).toContain("hidden md:block");
    expect(screen.getAllByRole("heading", { name: "Adaptive home" })).toHaveLength(2);
    expect(screen.getByText("Mobile summary")).toBeTruthy();
    expect(screen.getAllByText("Dashboard sidebar")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
  });

  test("renders mobile workflow helper components", async () => {
    installMatchMedia();

    const { container } = render(
      <>
        <MobileToolbar label="Filters">
          <Button variant="outline">Open</Button>
          <Button variant="outline">Assigned</Button>
        </MobileToolbar>
        <MobileOverflowPanel
          title="Filters"
          description="Queue controls"
          trigger={<Button>Open filters</Button>}
          footer={<Button>Apply</Button>}
        >
          <label htmlFor="blocked-only">
            Blocked only
            <input id="blocked-only" type="checkbox" />
          </label>
        </MobileOverflowPanel>
        <MobileCompanionPanel
          title="Related records"
          trigger={<Button variant="outline">Open related records</Button>}
          companion={<aside>Companion content</aside>}
        />
        <MobileStickyFooter layout="stacked" primaryAction={<Button>Apply footer</Button>} />
      </>,
    );

    expect(screen.getByRole("toolbar", { name: "Filters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open related records" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply footer" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="mobile-overflow-panel"]')).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Open filters" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    expect(screen.getByText("Queue controls")).toBeTruthy();
    expect(screen.getByLabelText("Blocked only")).toBeTruthy();
  });
});
