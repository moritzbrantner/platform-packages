import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test } from "vitest";

import { Button, Toolbar, ToolbarGroup, ToolbarTitle } from "@moritzbrantner/ui";

import {
  DashboardScreen,
  DetailScreen,
  FormScreen,
  MobileActionDock,
  MobileDashboardScreen,
  MobileDetailScreen,
  MobileFormScreen,
  MobileScreenShell,
  MobileWorkbenchScreen,
  PublicScreen,
  WorkbenchScreen,
} from "../..";

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
    render(
      <MobileScreenShell>
        <p>Custom shell content</p>
        <MobileActionDock>
          <Button>Continue</Button>
        </MobileActionDock>
      </MobileScreenShell>,
    );

    expect(screen.getByText("Custom shell content")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });
});
