import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  CollaborationOverviewView,
  CollaborationOverviewTable,
  CollaborationOverviewTree,
  createCollaborationStore,
  loadCollaborationStore,
} from "@moritzbrantner/collaboration";

describe("@moritzbrantner/collaboration", () => {
  test("merges concurrent work sessions and rolls counts up the tree", () => {
    const timestamps = [
      "2026-04-16T09:00:00.000Z",
      "2026-04-16T09:01:00.000Z",
      "2026-04-16T09:02:00.000Z",
      "2026-04-16T09:03:00.000Z",
      "2026-04-16T09:04:00.000Z",
      "2026-04-16T09:05:00.000Z",
    ];
    const base = createCollaborationStore({
      actorId: "base-actor",
      now: () => timestamps.shift() ?? "2026-04-16T09:06:00.000Z",
    });

    base.addObject({ id: "project", kind: "folder", name: "Project" });
    base.addObject({ id: "brief", kind: "document", name: "Brief", parentId: "project" });
    base.addObject({ id: "specs", kind: "document", name: "Specs", parentId: "project" });
    base.upsertCollaborator({ displayName: "Alex", id: "alex" });
    base.upsertCollaborator({ displayName: "Sam", id: "sam" });

    const writer = base.fork("writer-actor");
    const reviewer = base.fork("reviewer-actor");

    writer.upsertSession({
      collaboratorId: "alex",
      id: "session-alex",
      objectIds: ["brief"],
      status: "active",
    });
    reviewer.upsertSession({
      collaboratorId: "sam",
      id: "session-sam",
      objectIds: ["specs"],
      status: "active",
    });

    base.merge(writer);
    base.merge(reviewer);

    const overview = base.overview();
    const project = overview.rows.find((row) => row.id === "project");
    const brief = overview.rows.find((row) => row.id === "brief");
    const specs = overview.rows.find((row) => row.id === "specs");

    expect(overview.summary.activeCollaboratorCount).toBe(2);
    expect(overview.summary.activeSessionCount).toBe(2);
    expect(project?.directActiveCollaboratorCount).toBe(0);
    expect(project?.totalActiveCollaboratorCount).toBe(2);
    expect(project?.totalActiveSessionCount).toBe(2);
    expect(brief?.directActiveCollaborators.map((collaborator) => collaborator.displayName)).toEqual([
      "Alex",
    ]);
    expect(specs?.directActiveCollaborators.map((collaborator) => collaborator.displayName)).toEqual([
      "Sam",
    ]);
  });

  test("applies incremental changes and restores from serialized state", () => {
    const origin = createCollaborationStore({
      actorId: "origin-actor",
      now: () => "2026-04-16T10:00:00.000Z",
    });

    origin.addObject({ id: "workspace", kind: "folder", name: "Workspace" });
    origin.addObject({
      id: "kanban",
      kind: "document",
      name: "Kanban",
      parentId: "workspace",
    });
    origin.upsertCollaborator({ displayName: "Lee", id: "lee" });

    const replica = origin.fork("replica-actor");
    const baselineHeads = origin.getHeads();

    replica.upsertSession({
      collaboratorId: "lee",
      id: "session-lee",
      objectIds: ["kanban"],
      status: "active",
    });

    origin.applyChanges(replica.getChangesSince(baselineHeads));

    const restored = loadCollaborationStore(origin.save(), {
      actorId: "restored-actor",
    });
    const kanban = restored.overview().rows.find((row) => row.id === "kanban");

    expect(kanban?.directActiveCollaboratorCount).toBe(1);
    expect(kanban?.directActiveCollaborators[0]?.displayName).toBe("Lee");
  });

  test("renders table and tree overviews", () => {
    const store = createCollaborationStore({
      now: () => "2026-04-16T11:00:00.000Z",
    });

    store.addObject({ id: "team-space", kind: "folder", name: "Team Space" });
    store.addObject({
      id: "roadmap",
      kind: "document",
      name: "Roadmap",
      parentId: "team-space",
    });
    store.upsertCollaborator({ displayName: "Nina", id: "nina" });
    store.upsertSession({
      collaboratorId: "nina",
      id: "session-nina",
      objectIds: ["roadmap"],
      status: "active",
    });

    const overview = store.overview();
    render(
      <>
        <CollaborationOverviewTable overview={overview} />
        <CollaborationOverviewTree overview={overview} />
        <CollaborationOverviewView document={store} layout="table" />
      </>,
    );

    expect(screen.getAllByRole("table", { name: "Collaboration overview" })).toHaveLength(2);
    expect(screen.getByLabelText("Collaboration tree")).toBeTruthy();
    expect(screen.getAllByText("Roadmap").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nina").length).toBeGreaterThan(0);
    expect(screen.getByText("(0 direct, 1 in subtree)")).toBeTruthy();
  });
});
