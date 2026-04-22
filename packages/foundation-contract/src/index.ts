export type AppRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "USER";

export const appPermissionKeys = [
  "dashboard.view",
  "account.updateOwnEmail",
  "account.deleteOwn",
  "notifications.readOwn",
  "profile.editOwn",
  "profile.manageOwnImage",
  "profile.manageOwnTags",
  "profile.manageOwnSearchVisibility",
  "profile.manageOwnFollowerVisibility",
  "profile.follow",
  "profile.block",
  "workspace.access",
  "workspace.dataEntry.write",
] as const;

export type AppPermissionKey = (typeof appPermissionKeys)[number];
export type RolePermissionAssignments = Record<AppRole, readonly AppPermissionKey[]>;

function uniquePermissions(permissions: readonly AppPermissionKey[]) {
  return [...new Set(permissions)] as AppPermissionKey[];
}

export const defaultRolePermissionAssignments: RolePermissionAssignments = {
  USER: uniquePermissions([
    "dashboard.view",
    "account.updateOwnEmail",
    "account.deleteOwn",
    "notifications.readOwn",
    "profile.editOwn",
    "profile.manageOwnImage",
    "profile.manageOwnTags",
    "profile.manageOwnSearchVisibility",
    "profile.manageOwnFollowerVisibility",
    "profile.follow",
    "profile.block",
    "workspace.access",
  ]),
  MANAGER: uniquePermissions([
    "dashboard.view",
    "account.updateOwnEmail",
    "account.deleteOwn",
    "notifications.readOwn",
    "profile.editOwn",
    "profile.manageOwnImage",
    "profile.manageOwnTags",
    "profile.manageOwnSearchVisibility",
    "profile.manageOwnFollowerVisibility",
    "profile.follow",
    "profile.block",
    "workspace.access",
  ]),
  ADMIN: uniquePermissions([
    "dashboard.view",
    "account.updateOwnEmail",
    "account.deleteOwn",
    "notifications.readOwn",
    "profile.editOwn",
    "profile.manageOwnImage",
    "profile.manageOwnTags",
    "profile.manageOwnSearchVisibility",
    "profile.manageOwnFollowerVisibility",
    "profile.follow",
    "profile.block",
    "workspace.access",
    "workspace.dataEntry.write",
  ]),
  SUPERADMIN: uniquePermissions([...appPermissionKeys]),
};

export function getPermissionsForRole(role: AppRole | null | undefined) {
  return role ? (defaultRolePermissionAssignments[role] ?? []) : [];
}

export function hasPermission(role: AppRole | null | undefined, permission: AppPermissionKey) {
  return getPermissionsForRole(role).includes(permission);
}

export function canAccessDataEntryWorkspace(role: AppRole | null | undefined) {
  return hasPermission(role, "workspace.access");
}

export function canWriteDataEntryRecords(role: AppRole | null | undefined) {
  return hasPermission(role, "workspace.dataEntry.write");
}

export function canReadOwnNotifications(role: AppRole | null | undefined) {
  return hasPermission(role, "notifications.readOwn");
}

export function canEditOwnProfile(role: AppRole | null | undefined) {
  return hasPermission(role, "profile.editOwn");
}

export function canFollowProfiles(role: AppRole | null | undefined) {
  return hasPermission(role, "profile.follow");
}

export function canBlockProfiles(role: AppRole | null | undefined) {
  return hasPermission(role, "profile.block");
}

export const backgroundOptions = ["paper", "aurora", "dusk", "forest"] as const;
export type BackgroundOption = (typeof backgroundOptions)[number];

export const dateFormatOptions = ["localized", "long", "iso"] as const;
export type DateFormatOption = (typeof dateFormatOptions)[number];

export type NotificationSettings = {
  enabled: boolean;
  type: string;
};

export type SecuritySettings = {
  passwordRecoveryTwoFactorEnabled: boolean;
};

export type AppSettings = {
  background: BackgroundOption;
  dateFormat: DateFormatOption;
  weekStartsOn: 0 | 1;
  showOutsideDays: boolean;
  compactSpacing: boolean;
  reducedMotion: boolean;
  showHotkeyHints: boolean;
  security: SecuritySettings;
  notifications: NotificationSettings;
};

export const defaultAppSettings: AppSettings = {
  background: "paper",
  dateFormat: "localized",
  weekStartsOn: 1,
  showOutsideDays: true,
  compactSpacing: false,
  reducedMotion: false,
  showHotkeyHints: true,
  security: {
    passwordRecoveryTwoFactorEnabled: false,
  },
  notifications: {
    enabled: true,
    type: "instant",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBackgroundOption(value: unknown): value is BackgroundOption {
  return typeof value === "string" && backgroundOptions.includes(value as BackgroundOption);
}

function isDateFormatOption(value: unknown): value is DateFormatOption {
  return typeof value === "string" && dateFormatOptions.includes(value as DateFormatOption);
}

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return defaultAppSettings;
  }

  const notifications = isRecord(value.notifications) ? value.notifications : null;
  const security = isRecord(value.security) ? value.security : null;

  return {
    background: isBackgroundOption(value.background)
      ? value.background
      : defaultAppSettings.background,
    dateFormat: isDateFormatOption(value.dateFormat)
      ? value.dateFormat
      : defaultAppSettings.dateFormat,
    weekStartsOn: value.weekStartsOn === 0 ? 0 : 1,
    showOutsideDays:
      typeof value.showOutsideDays === "boolean"
        ? value.showOutsideDays
        : defaultAppSettings.showOutsideDays,
    compactSpacing:
      typeof value.compactSpacing === "boolean"
        ? value.compactSpacing
        : defaultAppSettings.compactSpacing,
    reducedMotion:
      typeof value.reducedMotion === "boolean"
        ? value.reducedMotion
        : defaultAppSettings.reducedMotion,
    showHotkeyHints:
      typeof value.showHotkeyHints === "boolean"
        ? value.showHotkeyHints
        : defaultAppSettings.showHotkeyHints,
    security: {
      passwordRecoveryTwoFactorEnabled:
        typeof security?.passwordRecoveryTwoFactorEnabled === "boolean"
          ? security.passwordRecoveryTwoFactorEnabled
          : defaultAppSettings.security.passwordRecoveryTwoFactorEnabled,
    },
    notifications: {
      enabled:
        typeof notifications?.enabled === "boolean"
          ? notifications.enabled
          : defaultAppSettings.notifications.enabled,
      type:
        typeof notifications?.type === "string"
          ? notifications.type
          : defaultAppSettings.notifications.type,
    },
  };
}

export function formatDatePreview(date: Date, settings: AppSettings, locale: string) {
  if (settings.dateFormat === "iso") {
    return date.toISOString().slice(0, 10);
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: settings.dateFormat === "long" ? "full" : "medium",
  }).format(date);
}

export const followerVisibilityRoles = ["PUBLIC", "MEMBERS", "PRIVATE"] as const;
export type FollowerVisibilityRole = (typeof followerVisibilityRoles)[number];

export type ProfileDirectoryEntry = {
  userId: string;
  tag: string;
  displayName: string;
  imageUrl: string | null;
  headline?: string;
  location?: string;
  bio?: string;
  isSearchable?: boolean;
  followerVisibility?: FollowerVisibilityRole;
};

export type ProfileViewPayload = {
  userId: string;
  tag: string;
  displayName: string;
  imageUrl: string | null;
  followerCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isBlockedByViewer: boolean;
};

export type ProfileRelationshipState = {
  followingUserIds: readonly string[];
  blockedUserIds: readonly string[];
};

export const demoProfiles: readonly ProfileDirectoryEntry[] = [
  {
    userId: "user-alex",
    tag: "alex",
    displayName: "Alex Mercer",
    imageUrl: null,
    headline: "Product engineer",
    location: "Berlin, Germany",
    bio: "Designing calm tools for teams that ship across web, mobile, and desktop.",
    isSearchable: true,
    followerVisibility: "PUBLIC",
  },
  {
    userId: "user-jules",
    tag: "jules",
    displayName: "Jules Costa",
    imageUrl: null,
    headline: "Frontend platform lead",
    location: "Porto, Portugal",
    bio: "Keeping shared packages predictable while teams move quickly.",
    isSearchable: true,
    followerVisibility: "MEMBERS",
  },
  {
    userId: "user-mika",
    tag: "mika",
    displayName: "Mika Chen",
    imageUrl: null,
    headline: "Design technologist",
    location: "Taipei, Taiwan",
    bio: "Blending motion, interaction, and content systems into one product language.",
    isSearchable: true,
    followerVisibility: "PUBLIC",
  },
  {
    userId: "user-sam",
    tag: "sam",
    displayName: "Sam Rivera",
    imageUrl: null,
    headline: "Operations manager",
    location: "Madrid, Spain",
    bio: "Turning team workflows into measurable operating rhythms.",
    isSearchable: true,
    followerVisibility: "PRIVATE",
  },
];

function addUnique(values: readonly string[], value: string) {
  return values.includes(value) ? [...values] : [...values, value];
}

function removeValue(values: readonly string[], value: string) {
  return values.filter((item) => item !== value);
}

export function followProfile(
  state: ProfileRelationshipState,
  userId: string,
): ProfileRelationshipState {
  if (state.blockedUserIds.includes(userId)) {
    return state;
  }

  return {
    ...state,
    followingUserIds: addUnique(state.followingUserIds, userId),
  };
}

export function unfollowProfile(
  state: ProfileRelationshipState,
  userId: string,
): ProfileRelationshipState {
  return {
    ...state,
    followingUserIds: removeValue(state.followingUserIds, userId),
  };
}

export function blockProfile(
  state: ProfileRelationshipState,
  userId: string,
): ProfileRelationshipState {
  return {
    followingUserIds: removeValue(state.followingUserIds, userId),
    blockedUserIds: addUnique(state.blockedUserIds, userId),
  };
}

export function unblockProfile(
  state: ProfileRelationshipState,
  userId: string,
): ProfileRelationshipState {
  return {
    ...state,
    blockedUserIds: removeValue(state.blockedUserIds, userId),
  };
}

export function isProfileBlocked(state: ProfileRelationshipState, userId: string) {
  return state.blockedUserIds.includes(userId);
}

export function getVisibleProfiles(
  profiles: readonly ProfileDirectoryEntry[],
  state: ProfileRelationshipState,
) {
  return profiles.filter((profile) => !isProfileBlocked(state, profile.userId));
}

export type NotificationStatus = "unread" | "read";

export type NotificationFeedItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  status: NotificationStatus;
  createdAt: string;
};

export type NotificationsPageData = {
  unreadCount: number;
  todayCount: number;
  items: NotificationFeedItem[];
};

export const demoNotificationFeed: readonly NotificationFeedItem[] = [
  {
    id: "notif-profile",
    title: "Profile views are trending",
    body: "Your public profile appeared in six demo directory searches today.",
    href: "/profile/@alex",
    status: "unread",
    createdAt: "2026-04-20T08:15:00.000Z",
  },
  {
    id: "notif-follow",
    title: "Jules followed you",
    body: "Open the people directory to review your current following list.",
    href: "/people",
    status: "unread",
    createdAt: "2026-04-20T09:30:00.000Z",
  },
  {
    id: "notif-settings",
    title: "Privacy preferences saved",
    body: "Follower visibility is currently available to members.",
    href: "/settings",
    status: "read",
    createdAt: "2026-04-19T14:10:00.000Z",
  },
];

function countUnread(items: readonly NotificationFeedItem[]) {
  return items.filter((item) => item.status === "unread").length;
}

function countToday(
  items: readonly NotificationFeedItem[],
  now = new Date("2026-04-20T12:00:00.000Z"),
) {
  const todayKey = now.toISOString().slice(0, 10);
  return items.filter((item) => item.createdAt.slice(0, 10) === todayKey).length;
}

export function createNotificationsPageData(
  items: readonly NotificationFeedItem[] = demoNotificationFeed,
): NotificationsPageData {
  return {
    unreadCount: countUnread(items),
    todayCount: countToday(items),
    items: items.map((item) => ({ ...item })),
  };
}

export function markNotificationRead(
  state: NotificationsPageData,
  notificationId: string,
): NotificationsPageData {
  const items = state.items.map((item) =>
    item.id === notificationId ? { ...item, status: "read" as const } : item,
  );

  return {
    ...state,
    unreadCount: countUnread(items),
    items,
  };
}

export function markAllNotificationsRead(state: NotificationsPageData): NotificationsPageData {
  const items = state.items.map((item) => ({ ...item, status: "read" as const }));

  return {
    ...state,
    unreadCount: 0,
    items,
  };
}

export type ManagedTable = "User" | "Profile" | "SecurityAuditLog" | "SecurityRateLimitCounter";

export const managedTables: readonly ManagedTable[] = [
  "User",
  "Profile",
  "SecurityAuditLog",
  "SecurityRateLimitCounter",
] as const;

export type TablePermission = {
  table: ManagedTable;
  label: string;
  readRoles: readonly AppRole[];
  writeRoles: readonly AppRole[];
};

export type TablePermissionView = {
  table: ManagedTable;
  label: string;
  canRead: boolean;
  canWrite: boolean;
  fields: readonly string[];
};

export const tablePermissions: readonly TablePermission[] = [
  {
    table: "User",
    label: "User",
    readRoles: ["MANAGER", "ADMIN", "SUPERADMIN"],
    writeRoles: ["ADMIN", "SUPERADMIN"],
  },
  {
    table: "Profile",
    label: "Profile",
    readRoles: ["USER", "MANAGER", "ADMIN", "SUPERADMIN"],
    writeRoles: ["USER", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    table: "SecurityAuditLog",
    label: "SecurityAuditLog",
    readRoles: ["MANAGER", "ADMIN", "SUPERADMIN"],
    writeRoles: ["ADMIN", "SUPERADMIN"],
  },
  {
    table: "SecurityRateLimitCounter",
    label: "SecurityRateLimitCounter",
    readRoles: ["ADMIN", "SUPERADMIN"],
    writeRoles: ["ADMIN", "SUPERADMIN"],
  },
] as const;

export function canReadTable(role: AppRole | null | undefined, table: ManagedTable) {
  if (!role) {
    return false;
  }

  return (
    tablePermissions.find((permission) => permission.table === table)?.readRoles.includes(role) ??
    false
  );
}

export function canWriteTable(role: AppRole | null | undefined, table: ManagedTable) {
  if (!role) {
    return false;
  }

  return (
    tablePermissions.find((permission) => permission.table === table)?.writeRoles.includes(role) ??
    false
  );
}

export function getFieldsForManagedTable(table: ManagedTable): readonly string[] {
  switch (table) {
    case "User":
      return ["email", "displayName", "role"];
    case "Profile":
      return ["tag", "displayName", "headline"];
    case "SecurityAuditLog":
      return ["actorId", "action", "createdAt"];
    case "SecurityRateLimitCounter":
      return ["key", "count", "resetAt"];
  }
}

export function getTablePermissionViews(role: AppRole | null | undefined): TablePermissionView[] {
  return tablePermissions
    .map((permission) => ({
      table: permission.table,
      label: permission.label,
      canRead: canReadTable(role, permission.table),
      canWrite: canWriteTable(role, permission.table),
      fields: getFieldsForManagedTable(permission.table),
    }))
    .filter((view) => view.canRead);
}

export const problemAreaOptions = [
  "account",
  "billing",
  "profiles",
  "notifications",
  "data-entry",
  "privacy",
  "other",
] as const;

export type ProblemArea = (typeof problemAreaOptions)[number];

export type ReportProblemPayload = {
  name: string;
  email: string;
  area: ProblemArea;
  pageUrl: string;
  subject: string;
  details: string;
};

export type ReportProblemValidationResult =
  | { ok: true; value: ReportProblemPayload }
  | { ok: false; errors: Partial<Record<keyof ReportProblemPayload, string>> };

function isProblemArea(value: unknown): value is ProblemArea {
  return typeof value === "string" && problemAreaOptions.includes(value as ProblemArea);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateReportProblemPayload(
  payload: Partial<ReportProblemPayload>,
): ReportProblemValidationResult {
  const errors: Partial<Record<keyof ReportProblemPayload, string>> = {};
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const area = payload.area;
  const pageUrl = String(payload.pageUrl ?? "").trim();
  const subject = String(payload.subject ?? "").trim();
  const details = String(payload.details ?? "").trim();

  if (name.length < 2) {
    errors.name = "Enter your name.";
  }

  if (!isEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isProblemArea(area)) {
    errors.area = "Choose a problem area.";
  }

  if (!pageUrl) {
    errors.pageUrl = "Enter the affected page URL.";
  }

  if (subject.length < 5) {
    errors.subject = "Use at least 5 characters.";
  }

  if (details.length < 20) {
    errors.details = "Use at least 20 characters.";
  }

  if (Object.keys(errors).length > 0 || !isProblemArea(area)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      area,
      pageUrl,
      subject,
      details,
    },
  };
}

export function createProblemReferenceId(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const minutePart =
    String(now.getUTCHours()).padStart(2, "0") + String(now.getUTCMinutes()).padStart(2, "0");
  return `PROB-${datePart}-${minutePart}`;
}
