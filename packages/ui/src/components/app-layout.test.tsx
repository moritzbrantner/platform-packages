import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test } from "vitest";

import {
  ActionBar,
  Button,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageShell,
  PageTitle,
  SectionGrid,
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceFooter,
  SurfaceHeader,
  SurfaceTitle,
} from "..";

describe("@moritzbrantner/ui app layout", () => {
  test("renders the canonical page shell and surface scaffold", () => {
    const { container } = render(
      <PageShell background="muted" maxWidth="wide">
        <PageHeader>
          <div>
            <PageTitle>Workspace home</PageTitle>
            <PageDescription>Shared scaffold for package operations.</PageDescription>
          </div>
          <PageActions>
            <Button>Refresh</Button>
          </PageActions>
        </PageHeader>
        <PageContent>
          <SectionGrid columns="sidebar-right">
            <Surface>
              <SurfaceHeader>
                <SurfaceTitle>Release queue</SurfaceTitle>
                <SurfaceDescription>Packages staged for verification.</SurfaceDescription>
              </SurfaceHeader>
              <SurfaceContent className="mt-4">Ready for review</SurfaceContent>
              <SurfaceFooter>
                <ActionBar sticky className="w-full">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save</Button>
                </ActionBar>
              </SurfaceFooter>
            </Surface>
            <Surface variant="muted">
              <SurfaceHeader>
                <SurfaceTitle>Sidebar</SurfaceTitle>
              </SurfaceHeader>
              <SurfaceContent>Notes</SurfaceContent>
            </Surface>
          </SectionGrid>
        </PageContent>
      </PageShell>,
    );

    expect(screen.getByRole("heading", { name: "Workspace home" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
    expect(screen.getByText("Release queue")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(container.querySelector("[data-slot='page-shell']")).toBeTruthy();
    expect(container.querySelector("[data-slot='surface']")).toBeTruthy();
    expect(container.querySelector("[data-slot='action-bar']")).toBeTruthy();
  });
});
