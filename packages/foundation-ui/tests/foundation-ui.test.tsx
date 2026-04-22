import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, test, vi } from "vitest";

import {
  AuthScreen,
  DataEntryScreen,
  FoundationAppShell,
  FoundationProvider,
  NotificationsScreen,
  PeopleScreen,
  ProfileScreen,
  ReportProblemScreen,
  SettingsScreen,
  UploadsScreen,
  createMemoryFoundationBackend,
  type FoundationBackend,
  type FoundationRuntime,
} from "@moritzbrantner/foundation-ui";

function renderWithRuntime(
  ui: React.ReactElement,
  backend: FoundationBackend = createMemoryFoundationBackend(),
) {
  const runtime: FoundationRuntime = {
    platform: "web",
    locale: "en-US",
    backend,
    navigate: vi.fn(),
  };

  return render(<FoundationProvider runtime={runtime}>{ui}</FoundationProvider>);
}

describe("@moritzbrantner/foundation-ui", () => {
  test("renders the app shell and shared navbar", async () => {
    renderWithRuntime(<FoundationAppShell activeRouteId="people" />);

    expect(await screen.findByRole("heading", { name: "People" })).toBeTruthy();
    expect(screen.getByRole("navigation")).toBeTruthy();
  });

  test.each([
    ["auth", <AuthScreen />, "Account access"],
    ["profile", <ProfileScreen />, "Profile"],
    ["people", <PeopleScreen />, "People"],
    ["notifications", <NotificationsScreen />, "Notifications"],
    ["settings", <SettingsScreen />, "Settings"],
    ["report problem", <ReportProblemScreen />, "Report a problem"],
    ["data entry", <DataEntryScreen role="ADMIN" />, "Data entry"],
    ["uploads", <UploadsScreen />, "Uploads"],
  ])("renders %s", async (_name, component, heading) => {
    renderWithRuntime(component);

    expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
  });

  test("people actions call backend adapter methods", async () => {
    const backend = createMemoryFoundationBackend();
    const followPerson = vi.spyOn(backend, "followPerson");

    renderWithRuntime(<PeopleScreen />, backend);
    fireEvent.click(
      await screen
        .findAllByRole("button", { name: "Follow" })
        .then((buttons) => buttons[0] as HTMLElement),
    );

    await waitFor(() => expect(followPerson).toHaveBeenCalledWith("user-alex"));
  });

  test("settings actions call backend adapter methods", async () => {
    const backend = createMemoryFoundationBackend();
    const updateSettings = vi.spyOn(backend, "updateSettings");

    renderWithRuntime(<SettingsScreen />, backend);
    fireEvent.click(await screen.findByLabelText("Compact spacing"));

    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ compactSpacing: true }));
  });

  test("report problem validates and submits through the backend", async () => {
    const backend = createMemoryFoundationBackend();
    const submitReportProblem = vi.spyOn(backend, "submitReportProblem");

    renderWithRuntime(<ReportProblemScreen />, backend);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Alex Mercer" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Affected page"), { target: { value: "/people" } });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Follow button issue" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "The follow button did not update after tapping it twice." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(submitReportProblem).toHaveBeenCalled());
    expect((await screen.findByRole("status")).textContent).toContain("Report submitted");
  });

  test("uploads can add a sample through the backend", async () => {
    const backend = createMemoryFoundationBackend();
    const addUploadSample = vi.spyOn(backend, "addUploadSample");

    renderWithRuntime(<UploadsScreen />, backend);
    fireEvent.click(await screen.findByRole("button", { name: "Add sample" }));

    await waitFor(() => expect(addUploadSample).toHaveBeenCalled());
    expect(await screen.findByText(/launch-photo\.heic/)).toBeTruthy();
  });
});
