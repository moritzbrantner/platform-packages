import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test } from "vitest";

import { Button, Toolbar, ToolbarGroup, ToolbarTitle } from "@moritzbrantner/ui";

import { DashboardScreen, DetailScreen, FormScreen, PublicScreen, WorkbenchScreen } from "../..";

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
});
