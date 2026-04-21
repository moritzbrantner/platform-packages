import { describe, expect, test } from "vitest";

import {
  appPermissionKeys,
  blockProfile,
  canAccessDataEntryWorkspace,
  canWriteDataEntryRecords,
  createNotificationsPageData,
  createProblemReferenceId,
  defaultAppSettings,
  defaultRolePermissionAssignments,
  followProfile,
  getTablePermissionViews,
  getVisibleProfiles,
  hasPermission,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeAppSettings,
  problemAreaOptions,
  unblockProfile,
  unfollowProfile,
  validateReportProblemPayload,
  type ProfileRelationshipState,
} from "@moritzbrantner/foundation-contract";

describe("@moritzbrantner/foundation-contract", () => {
  test("role permission defaults expose expected foundation access", () => {
    expect(canAccessDataEntryWorkspace("USER")).toBe(true);
    expect(canWriteDataEntryRecords("USER")).toBe(false);
    expect(canWriteDataEntryRecords("ADMIN")).toBe(true);

    for (const permission of appPermissionKeys) {
      expect(hasPermission("SUPERADMIN", permission)).toBe(true);
      expect(defaultRolePermissionAssignments.SUPERADMIN).toContain(permission);
    }
  });

  test("data-entry table views enforce role-specific reads and writes", () => {
    const userViews = getTablePermissionViews("USER");
    expect(userViews.map((view) => view.table)).toEqual(["Profile"]);
    expect(userViews[0]?.canWrite).toBe(true);

    const managerViews = getTablePermissionViews("MANAGER");
    expect(managerViews.map((view) => view.table)).toEqual(["User", "Profile", "SecurityAuditLog"]);
    expect(managerViews.find((view) => view.table === "SecurityAuditLog")?.canWrite).toBe(false);

    const adminViews = getTablePermissionViews("ADMIN");
    expect(adminViews.find((view) => view.table === "User")?.canWrite).toBe(true);
  });

  test("settings normalization defaults invalid input and preserves valid values", () => {
    expect(normalizeAppSettings(null)).toEqual(defaultAppSettings);
    expect(
      normalizeAppSettings({
        background: "forest",
        dateFormat: "bad",
        weekStartsOn: 0,
        showOutsideDays: false,
        compactSpacing: true,
        reducedMotion: true,
        showHotkeyHints: false,
        security: { passwordRecoveryTwoFactorEnabled: true },
        notifications: { enabled: false, type: "digest" },
      }),
    ).toEqual({
      ...defaultAppSettings,
      background: "forest",
      weekStartsOn: 0,
      showOutsideDays: false,
      compactSpacing: true,
      reducedMotion: true,
      showHotkeyHints: false,
      security: { passwordRecoveryTwoFactorEnabled: true },
      notifications: { enabled: false, type: "digest" },
    });
  });

  test("notification reducers support mark-one and mark-all read semantics", () => {
    const initial = createNotificationsPageData();
    const unread = initial.items.find((item) => item.status === "unread");

    expect(unread).toBeTruthy();
    const next = markNotificationRead(initial, unread?.id ?? "");
    expect(next.unreadCount).toBe(initial.unreadCount - 1);
    expect(next.items.find((item) => item.id === unread?.id)?.status).toBe("read");
    expect(markAllNotificationsRead(initial).unreadCount).toBe(0);
  });

  test("profile reducers handle follow, unfollow, block, unblock, and visibility", () => {
    const initial: ProfileRelationshipState = {
      followingUserIds: [],
      blockedUserIds: [],
    };

    const followed = followProfile(initial, "user-jules");
    expect(followed.followingUserIds).toEqual(["user-jules"]);
    expect(unfollowProfile(followed, "user-jules").followingUserIds).toEqual([]);

    const blocked = blockProfile(followed, "user-jules");
    expect(blocked.followingUserIds).toEqual([]);
    expect(getVisibleProfiles([{ userId: "user-jules", tag: "jules", displayName: "Jules", imageUrl: null }], blocked)).toEqual([]);
    expect(unblockProfile(blocked, "user-jules").blockedUserIds).toEqual([]);
  });

  test("report validation rejects invalid input and accepts valid payloads", () => {
    expect(
      validateReportProblemPayload({
        name: "A",
        email: "bad-email",
        area: problemAreaOptions[0],
        pageUrl: "/people",
        subject: "bad",
        details: "short",
      }).ok,
    ).toBe(false);

    expect(
      validateReportProblemPayload({
        name: "Alex Mercer",
        email: "alex@example.com",
        area: "profiles",
        pageUrl: "/people",
        subject: "Follow button issue",
        details: "The follow button did not update after tapping it twice.",
      }).ok,
    ).toBe(true);
    expect(createProblemReferenceId(new Date("2026-04-20T09:35:00.000Z"))).toBe("PROB-20260420-0935");
  });
});
