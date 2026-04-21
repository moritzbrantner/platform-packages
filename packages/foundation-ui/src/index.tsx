"use client";

import * as React from "react";

import type { AuthClient, AuthSession, AuthState, AuthUser } from "@moritzbrantner/auth-contract";
import {
  blockProfile,
  createNotificationsPageData,
  createProblemReferenceId,
  defaultAppSettings,
  demoProfiles,
  followProfile,
  formatDatePreview,
  getTablePermissionViews,
  getVisibleProfiles,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeAppSettings,
  problemAreaOptions,
  unblockProfile,
  unfollowProfile,
  validateReportProblemPayload,
  type AppRole,
  type AppSettings,
  type NotificationsPageData,
  type ProblemArea,
  type ProfileDirectoryEntry,
  type ProfileRelationshipState,
  type ReportProblemPayload,
  type TablePermissionView,
} from "@moritzbrantner/foundation-contract";
import {
  formatFileSize,
  getUploadGuide,
  getUploadManagementHint,
  inferUploadKind,
  mobileUploadPresets,
  uploadLifecycle,
  uploadTypeGroups,
  type UploadPlatform,
} from "@moritzbrantner/upload-playbook";
import { PlatformNavbar, type PlatformNavbarRenderLinkProps } from "@moritzbrantner/ui";

export type FoundationPlatform = "web" | "electron" | "tauri";

export type FoundationRouteId =
  | "auth"
  | "profile"
  | "people"
  | "notifications"
  | "settings"
  | "report-problem"
  | "data-entry"
  | "uploads";

export type FoundationCapability =
  | "auth"
  | "profile"
  | "people"
  | "notifications"
  | "settings"
  | "reportProblem"
  | "dataEntry"
  | "uploads";

export type FoundationLinkRenderInput = {
  routeId: FoundationRouteId;
  href: string;
  className: string;
  children: React.ReactNode;
  "aria-current"?: "page";
  onClick: () => void;
};

type CommonLabelKey = "loading" | "save" | "saved" | "cancel" | "submit" | "submitting";
type AuthLabelKey = "title" | "description" | "login" | "logout" | "register" | "authenticatedAs";
type ProfileLabelKey = "title" | "description" | "followers" | "following" | "blocked" | "edit";
type PeopleLabelKey = "title" | "description" | "follow" | "unfollow" | "block" | "unblock" | "empty";
type NotificationsLabelKey = "title" | "description" | "unread" | "today" | "markRead" | "markAllRead" | "empty";
type SettingsLabelKey = "title" | "description" | "appearance" | "dates" | "workflow" | "notifications" | "preview";
type ReportProblemLabelKey = "title" | "description" | "name" | "email" | "area" | "pageUrl" | "subject" | "details" | "success";
type DataEntryLabelKey = "title" | "description" | "readOnly" | "createRow" | "created";
type UploadsLabelKey = "title" | "description" | "guide" | "lifecycle" | "types" | "queue";

export type FoundationLabels = {
  appName?: string;
  routes?: Partial<Record<FoundationRouteId, string>>;
  common?: Partial<Record<CommonLabelKey, string>>;
  auth?: Partial<Record<AuthLabelKey, string>>;
  profile?: Partial<Record<ProfileLabelKey, string>>;
  people?: Partial<Record<PeopleLabelKey, string>>;
  notifications?: Partial<Record<NotificationsLabelKey, string>>;
  settings?: Partial<Record<SettingsLabelKey, string>>;
  reportProblem?: Partial<Record<ReportProblemLabelKey, string>>;
  dataEntry?: Partial<Record<DataEntryLabelKey, string>>;
  uploads?: Partial<Record<UploadsLabelKey, string>>;
};

type ResolvedFoundationLabels = {
  appName: string;
  routes: Record<FoundationRouteId, string>;
  common: Record<CommonLabelKey, string>;
  auth: Record<AuthLabelKey, string>;
  profile: Record<ProfileLabelKey, string>;
  people: Record<PeopleLabelKey, string>;
  notifications: Record<NotificationsLabelKey, string>;
  settings: Record<SettingsLabelKey, string>;
  reportProblem: Record<ReportProblemLabelKey, string>;
  dataEntry: Record<DataEntryLabelKey, string>;
  uploads: Record<UploadsLabelKey, string>;
};

export type FoundationRuntime = {
  platform: FoundationPlatform;
  locale: string;
  labels?: FoundationLabels;
  navigate: (routeId: FoundationRouteId) => void;
  renderLink?: (input: FoundationLinkRenderInput) => React.ReactNode;
  backend: FoundationBackend;
  capabilities?: Partial<Record<FoundationCapability, boolean>>;
};

export type FoundationProfile = ProfileDirectoryEntry & {
  followerCount: number;
  followingCount: number;
};

export type FoundationUploadItem = {
  id: string;
  name: string;
  sizeInBytes: number;
  mimeType?: string;
  source: string;
  status: "queued" | "validating" | "uploading" | "complete" | "failed";
};

export type FoundationBackend = AuthClient & {
  getAuthState?: () => MaybePromise<AuthState>;
  register?: (input: { email: string; displayName: string }) => MaybePromise<AuthSession>;
  getProfile?: () => MaybePromise<FoundationProfile>;
  updateProfile?: (input: Partial<Pick<FoundationProfile, "displayName" | "headline" | "location" | "bio">>) => MaybePromise<FoundationProfile>;
  listPeople?: () => MaybePromise<ProfileDirectoryEntry[]>;
  getRelationshipState?: () => MaybePromise<ProfileRelationshipState>;
  followPerson?: (userId: string) => MaybePromise<ProfileRelationshipState>;
  unfollowPerson?: (userId: string) => MaybePromise<ProfileRelationshipState>;
  blockPerson?: (userId: string) => MaybePromise<ProfileRelationshipState>;
  unblockPerson?: (userId: string) => MaybePromise<ProfileRelationshipState>;
  getNotifications?: () => MaybePromise<NotificationsPageData>;
  markNotificationRead?: (notificationId: string) => MaybePromise<NotificationsPageData>;
  markAllNotificationsRead?: () => MaybePromise<NotificationsPageData>;
  getSettings?: () => MaybePromise<AppSettings>;
  updateSettings?: (settings: Partial<AppSettings>) => MaybePromise<AppSettings>;
  submitReportProblem?: (payload: ReportProblemPayload) => MaybePromise<{ referenceId: string }>;
  getDataEntryTables?: (role?: AppRole | null) => MaybePromise<TablePermissionView[]>;
  createDataEntryRow?: (table: TablePermissionView, values: Record<string, string>) => MaybePromise<{ id: string }>;
  getUploads?: () => MaybePromise<FoundationUploadItem[]>;
  addUploadSample?: (item?: Partial<FoundationUploadItem>) => MaybePromise<FoundationUploadItem[]>;
};

type MaybePromise<T> = T | Promise<T>;

const defaultLabels: ResolvedFoundationLabels = {
  appName: "Foundation",
  routes: {
    auth: "Auth",
    profile: "Profile",
    people: "People",
    notifications: "Notifications",
    settings: "Settings",
    "report-problem": "Report problem",
    "data-entry": "Data entry",
    uploads: "Uploads",
  },
  common: {
    loading: "Loading...",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    submit: "Submit",
    submitting: "Submitting...",
  },
  auth: {
    title: "Account access",
    description: "Sign in, register, or end the current platform session.",
    login: "Sign in",
    logout: "Sign out",
    register: "Create demo account",
    authenticatedAs: "Signed in as",
  },
  profile: {
    title: "Profile",
    description: "Manage public profile basics and relationship counts.",
    followers: "Followers",
    following: "Following",
    blocked: "Blocked",
    edit: "Edit profile",
  },
  people: {
    title: "People",
    description: "Browse searchable profiles and manage follow/block relationships.",
    follow: "Follow",
    unfollow: "Unfollow",
    block: "Block",
    unblock: "Unblock",
    empty: "No visible profiles.",
  },
  notifications: {
    title: "Notifications",
    description: "Review unread items and synchronize read state through the adapter.",
    unread: "Unread",
    today: "Today",
    markRead: "Mark read",
    markAllRead: "Mark all read",
    empty: "No notifications.",
  },
  settings: {
    title: "Settings",
    description: "Update shared appearance, date, workflow, security, and notification preferences.",
    appearance: "Appearance",
    dates: "Dates",
    workflow: "Workflow",
    notifications: "Notifications",
    preview: "Preview",
  },
  reportProblem: {
    title: "Report a problem",
    description: "Send a structured issue report to the host application backend.",
    name: "Name",
    email: "Email",
    area: "Area",
    pageUrl: "Affected page",
    subject: "Subject",
    details: "Details",
    success: "Report submitted",
  },
  dataEntry: {
    title: "Data entry",
    description: "Render role-aware table write surfaces without importing app database modules.",
    readOnly: "Read only",
    createRow: "Create row",
    created: "Row created",
  },
  uploads: {
    title: "Uploads",
    description: "Preview platform-specific upload guidance, file handling hints, and queue state.",
    guide: "Guide",
    lifecycle: "Lifecycle",
    types: "Types",
    queue: "Queue",
  },
};

const routeOrder: FoundationRouteId[] = [
  "profile",
  "people",
  "notifications",
  "settings",
  "report-problem",
  "data-entry",
  "uploads",
];

const routeCapabilities: Record<FoundationRouteId, FoundationCapability> = {
  auth: "auth",
  profile: "profile",
  people: "people",
  notifications: "notifications",
  settings: "settings",
  "report-problem": "reportProblem",
  "data-entry": "dataEntry",
  uploads: "uploads",
};

const FoundationRuntimeContext = React.createContext<FoundationRuntime | null>(null);

export function FoundationProvider({
  runtime,
  children,
}: {
  runtime: FoundationRuntime;
  children: React.ReactNode;
}) {
  return <FoundationRuntimeContext.Provider value={runtime}>{children}</FoundationRuntimeContext.Provider>;
}

export function useFoundationRuntime() {
  const runtime = React.useContext(FoundationRuntimeContext);

  if (!runtime) {
    throw new Error("Foundation UI components must be rendered inside FoundationProvider.");
  }

  return runtime;
}

export function FoundationNavbar({ activeRouteId }: { activeRouteId?: FoundationRouteId }) {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const routes = getEnabledRoutes(runtime);

  return (
    <PlatformNavbar
      brand={<strong>{labels.appName}</strong>}
      variant={runtime.platform === "web" ? "web" : "desktop"}
      activeItemId={activeRouteId}
      groups={[
        {
          id: "core",
          label: labels.appName,
          items: routes.map((routeId) => ({
            id: routeId,
            label: labels.routes[routeId],
            href: `#${routeId}`,
            active: routeId === activeRouteId,
          })),
        },
      ]}
      onNavigate={(item) => runtime.navigate(item.id as FoundationRouteId)}
      renderLink={(props) => renderFoundationLink(runtime, props)}
    />
  );
}

export function FoundationAppShell({
  activeRouteId = "profile",
}: {
  activeRouteId?: FoundationRouteId;
}) {
  return (
    <div data-foundation-ui="app-shell" style={shellStyle}>
      <FoundationNavbar activeRouteId={activeRouteId} />
      <main style={mainStyle}>{renderRoute(activeRouteId)}</main>
    </div>
  );
}

export function AuthScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [authState, setAuthState] = React.useState<AuthState | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    readAuthState(runtime.backend).then((state) => {
      if (mounted) {
        setAuthState(state);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function refresh() {
    setAuthState(await readAuthState(runtime.backend));
  }

  async function handleLogin() {
    setPending(true);
    await runtime.backend.login();
    await refresh();
    setPending(false);
  }

  async function handleRegister() {
    setPending(true);
    await runtime.backend.register?.({ email: "demo@example.com", displayName: "Demo User" });
    await refresh();
    setPending(false);
  }

  async function handleLogout() {
    setPending(true);
    await runtime.backend.logout();
    await refresh();
    setPending(false);
  }

  const session = authState?.session;

  return (
    <Screen title={labels.auth.title} description={labels.auth.description}>
      <div style={panelStyle}>
        <p>{session ? `${labels.auth.authenticatedAs} ${session.user.displayName}` : labels.common.loading}</p>
        <div style={rowStyle}>
          <button type="button" onClick={handleLogin} disabled={pending}>
            {labels.auth.login}
          </button>
          <button type="button" onClick={handleRegister} disabled={pending || !runtime.backend.register}>
            {labels.auth.register}
          </button>
          <button type="button" onClick={handleLogout} disabled={pending || !session}>
            {labels.auth.logout}
          </button>
        </div>
      </div>
    </Screen>
  );
}

export function ProfileScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [profile, setProfile] = React.useState<FoundationProfile | null>(null);
  const [displayName, setDisplayName] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(runtime.backend.getProfile?.() ?? defaultProfile()).then((nextProfile) => {
      if (mounted) {
        setProfile(nextProfile);
        setDisplayName(nextProfile.displayName);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProfile = await Promise.resolve(runtime.backend.updateProfile?.({ displayName }) ?? {
      ...(profile ?? defaultProfile()),
      displayName,
    });
    setProfile(nextProfile);
  }

  return (
    <Screen title={labels.profile.title} description={labels.profile.description}>
      <div style={gridStyle}>
        <article style={panelStyle}>
          <h2>{profile?.displayName ?? labels.common.loading}</h2>
          <p>{profile?.headline}</p>
          <p>{profile?.location}</p>
          <p>{profile?.bio}</p>
        </article>
        <article style={panelStyle}>
          <h2>{labels.profile.edit}</h2>
          <form onSubmit={handleSave} style={formStyle}>
            <label>
              Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <button type="submit">{labels.common.save}</button>
          </form>
        </article>
        <Stat label={labels.profile.followers} value={String(profile?.followerCount ?? 0)} />
        <Stat label={labels.profile.following} value={String(profile?.followingCount ?? 0)} />
      </div>
    </Screen>
  );
}

export function PeopleScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [profiles, setProfiles] = React.useState<ProfileDirectoryEntry[]>([]);
  const [relationships, setRelationships] = React.useState<ProfileRelationshipState>({ followingUserIds: [], blockedUserIds: [] });

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      Promise.resolve(runtime.backend.listPeople?.() ?? demoProfiles),
      Promise.resolve(runtime.backend.getRelationshipState?.() ?? { followingUserIds: [], blockedUserIds: [] }),
    ]).then(([nextProfiles, nextRelationships]) => {
      if (mounted) {
        setProfiles([...nextProfiles]);
        setRelationships(nextRelationships);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function updateRelationship(action: () => MaybePromise<ProfileRelationshipState>) {
    setRelationships(await Promise.resolve(action()));
  }

  const visibleProfiles = getVisibleProfiles(profiles, relationships);

  return (
    <Screen title={labels.people.title} description={labels.people.description}>
      <div style={gridStyle}>
        {visibleProfiles.length === 0 ? <p>{labels.people.empty}</p> : null}
        {visibleProfiles.map((profile) => {
          const isFollowing = relationships.followingUserIds.includes(profile.userId);
          const isBlocked = relationships.blockedUserIds.includes(profile.userId);

          return (
            <article key={profile.userId} style={panelStyle}>
              <h2>{profile.displayName}</h2>
              <p>{profile.headline}</p>
              <p>{profile.bio}</p>
              <div style={rowStyle}>
                <button
                  type="button"
                  onClick={() =>
                    updateRelationship(() =>
                      isFollowing
                        ? (runtime.backend.unfollowPerson?.(profile.userId) ?? unfollowProfile(relationships, profile.userId))
                        : (runtime.backend.followPerson?.(profile.userId) ?? followProfile(relationships, profile.userId)),
                    )
                  }
                >
                  {isFollowing ? labels.people.unfollow : labels.people.follow}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateRelationship(() =>
                      isBlocked
                        ? (runtime.backend.unblockPerson?.(profile.userId) ?? unblockProfile(relationships, profile.userId))
                        : (runtime.backend.blockPerson?.(profile.userId) ?? blockProfile(relationships, profile.userId)),
                    )
                  }
                >
                  {isBlocked ? labels.people.unblock : labels.people.block}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Screen>
  );
}

export function NotificationsScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [data, setData] = React.useState<NotificationsPageData | null>(null);

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(runtime.backend.getNotifications?.() ?? createNotificationsPageData()).then((nextData) => {
      if (mounted) {
        setData(nextData);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function markRead(notificationId: string) {
    const nextData = await Promise.resolve(runtime.backend.markNotificationRead?.(notificationId) ?? markNotificationRead(data ?? createNotificationsPageData(), notificationId));
    setData(nextData);
  }

  async function markAllRead() {
    const nextData = await Promise.resolve(runtime.backend.markAllNotificationsRead?.() ?? markAllNotificationsRead(data ?? createNotificationsPageData()));
    setData(nextData);
  }

  return (
    <Screen title={labels.notifications.title} description={labels.notifications.description}>
      <div style={rowStyle}>
        <Stat label={labels.notifications.unread} value={String(data?.unreadCount ?? 0)} />
        <Stat label={labels.notifications.today} value={String(data?.todayCount ?? 0)} />
        <button type="button" onClick={markAllRead}>
          {labels.notifications.markAllRead}
        </button>
      </div>
      <div style={listStyle}>
        {data?.items.length === 0 ? <p>{labels.notifications.empty}</p> : null}
        {(data?.items ?? []).map((item) => (
          <article key={item.id} style={panelStyle}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <small>{item.status}</small>
            <div>
              <button type="button" onClick={() => markRead(item.id)} disabled={item.status === "read"}>
                {labels.notifications.markRead}
              </button>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  );
}

export function SettingsScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [settings, setSettings] = React.useState<AppSettings>(defaultAppSettings);
  const previewDate = new Date("2026-06-15T12:00:00.000Z");

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(runtime.backend.getSettings?.() ?? defaultAppSettings).then((nextSettings) => {
      if (mounted) {
        setSettings(normalizeAppSettings(nextSettings));
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function updateSettings(partial: Partial<AppSettings>) {
    const nextSettings = await Promise.resolve(runtime.backend.updateSettings?.(partial) ?? normalizeAppSettings({ ...settings, ...partial }));
    setSettings(nextSettings);
  }

  return (
    <Screen title={labels.settings.title} description={labels.settings.description}>
      <div style={gridStyle}>
        <article style={panelStyle}>
          <h2>{labels.settings.appearance}</h2>
          <label>
            Background
            <select value={settings.background} onChange={(event) => updateSettings({ background: event.target.value as AppSettings["background"] })}>
              <option value="paper">Paper</option>
              <option value="aurora">Aurora</option>
              <option value="dusk">Dusk</option>
              <option value="forest">Forest</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={settings.compactSpacing} onChange={(event) => updateSettings({ compactSpacing: event.target.checked })} />
            Compact spacing
          </label>
          <label>
            <input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} />
            Reduced motion
          </label>
        </article>
        <article style={panelStyle}>
          <h2>{labels.settings.dates}</h2>
          <label>
            Date format
            <select value={settings.dateFormat} onChange={(event) => updateSettings({ dateFormat: event.target.value as AppSettings["dateFormat"] })}>
              <option value="localized">Localized</option>
              <option value="long">Long</option>
              <option value="iso">ISO</option>
            </select>
          </label>
          <p>
            {labels.settings.preview}: {formatDatePreview(previewDate, settings, runtime.locale)}
          </p>
        </article>
        <article style={panelStyle}>
          <h2>{labels.settings.notifications}</h2>
          <label>
            <input
              type="checkbox"
              checked={settings.notifications.enabled}
              onChange={(event) =>
                updateSettings({
                  notifications: { ...settings.notifications, enabled: event.target.checked },
                })
              }
            />
            Enabled
          </label>
        </article>
      </div>
    </Screen>
  );
}

export function ReportProblemScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setMessage(null);
    setErrors({});

    const formData = new FormData(form);
    const validation = validateReportProblemPayload({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      area: String(formData.get("area") ?? "") as ProblemArea,
      pageUrl: String(formData.get("pageUrl") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      details: String(formData.get("details") ?? ""),
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      setPending(false);
      return;
    }

    const result = await Promise.resolve(runtime.backend.submitReportProblem?.(validation.value) ?? { referenceId: createProblemReferenceId() });
    setMessage(`${labels.reportProblem.success}: ${result.referenceId}`);
    form.reset();
    setPending(false);
  }

  return (
    <Screen title={labels.reportProblem.title} description={labels.reportProblem.description}>
      <form onSubmit={handleSubmit} style={formStyle} noValidate>
        <InputField name="name" label={labels.reportProblem.name} error={errors.name} />
        <InputField name="email" label={labels.reportProblem.email} type="email" error={errors.email} />
        <label>
          {labels.reportProblem.area}
          <select name="area" defaultValue={problemAreaOptions[0]}>
            {problemAreaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          {errors.area ? <small role="alert">{errors.area}</small> : null}
        </label>
        <InputField name="pageUrl" label={labels.reportProblem.pageUrl} error={errors.pageUrl} />
        <InputField name="subject" label={labels.reportProblem.subject} error={errors.subject} />
        <label>
          {labels.reportProblem.details}
          <textarea name="details" rows={6} />
          {errors.details ? <small role="alert">{errors.details}</small> : null}
        </label>
        <button type="submit" disabled={pending}>
          {pending ? labels.common.submitting : labels.common.submit}
        </button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </Screen>
  );
}

export function DataEntryScreen({ role = "USER" }: { role?: AppRole }) {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const [tables, setTables] = React.useState<TablePermissionView[]>([]);
  const [created, setCreated] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(runtime.backend.getDataEntryTables?.(role) ?? getTablePermissionViews(role)).then((nextTables) => {
      if (mounted) {
        setTables(nextTables);
      }
    });
    return () => {
      mounted = false;
    };
  }, [role, runtime.backend]);

  async function handleCreate(table: TablePermissionView, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(table.fields.map((field) => [field, String(formData.get(field) ?? "")]));
    const result = await Promise.resolve(runtime.backend.createDataEntryRow?.(table, values) ?? { id: `${table.table}-${Date.now()}` });
    setCreated(`${labels.dataEntry.created}: ${result.id}`);
    form.reset();
  }

  return (
    <Screen title={labels.dataEntry.title} description={labels.dataEntry.description}>
      <div style={gridStyle}>
        {tables.map((table) => (
          <article key={table.table} style={panelStyle}>
            <h2>{table.label}</h2>
            <p>{table.canWrite ? labels.dataEntry.createRow : labels.dataEntry.readOnly}</p>
            {table.canWrite ? (
              <form onSubmit={(event) => handleCreate(table, event)} style={formStyle}>
                {table.fields.map((field) => (
                  <InputField key={field} name={field} label={field} />
                ))}
                <button type="submit">{labels.dataEntry.createRow}</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
      {created ? <p role="status">{created}</p> : null}
    </Screen>
  );
}

export function UploadsScreen() {
  const runtime = useFoundationRuntime();
  const labels = resolveLabels(runtime.labels);
  const uploadPlatform: UploadPlatform = runtime.platform === "electron" ? "desktop" : runtime.platform === "tauri" ? "desktop" : "web";
  const guide = getUploadGuide(uploadPlatform);
  const [uploads, setUploads] = React.useState<FoundationUploadItem[]>([]);

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(runtime.backend.getUploads?.() ?? []).then((nextUploads) => {
      if (mounted) {
        setUploads(nextUploads);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runtime.backend]);

  async function addSample() {
    const preset = mobileUploadPresets[0];
    const nextUploads = await Promise.resolve(
      runtime.backend.addUploadSample?.({
        id: preset.id,
        name: preset.fileName,
        mimeType: preset.mimeType,
        sizeInBytes: preset.sizeInBytes,
        source: preset.source,
        status: "queued",
      }) ?? [
        ...uploads,
        {
          id: preset.id,
          name: preset.fileName,
          mimeType: preset.mimeType,
          sizeInBytes: preset.sizeInBytes,
          source: preset.source,
          status: "queued" as const,
        },
      ],
    );
    setUploads(nextUploads);
  }

  return (
    <Screen title={labels.uploads.title} description={labels.uploads.description}>
      <div style={gridStyle}>
        <article style={panelStyle}>
          <h2>{labels.uploads.guide}: {guide.title}</h2>
          <p>{guide.picker}</p>
          <p>{guide.queue}</p>
          <p>{guide.storage}</p>
        </article>
        <article style={panelStyle}>
          <h2>{labels.uploads.lifecycle}</h2>
          <ol>
            {uploadLifecycle.map((step) => (
              <li key={step.title}>{step.title}</li>
            ))}
          </ol>
        </article>
        <article style={panelStyle}>
          <h2>{labels.uploads.types}</h2>
          {uploadTypeGroups.map((group) => (
            <p key={group.title}>
              <strong>{group.title}</strong>: {group.examples}
            </p>
          ))}
        </article>
        <article style={panelStyle}>
          <h2>{labels.uploads.queue}</h2>
          <button type="button" onClick={addSample}>
            Add sample
          </button>
          <ul>
            {uploads.map((item) => {
              const kind = inferUploadKind(item.name, item.mimeType);
              const hint = getUploadManagementHint(kind, item.sizeInBytes);

              return (
                <li key={item.id}>
                  {item.name} ({formatFileSize(item.sizeInBytes)}) - {hint.label}
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </Screen>
  );
}

export function createMemoryFoundationBackend(options: {
  user?: Partial<AuthUser>;
  role?: AppRole;
} = {}): FoundationBackend {
  const user: AuthUser = {
    id: options.user?.id ?? "demo-user",
    email: options.user?.email ?? "demo@example.com",
    displayName: options.user?.displayName ?? "Demo User",
    roles: options.user?.roles ?? [options.role ?? "USER"],
    permissions: options.user?.permissions ?? [],
  };
  let session: AuthSession | null = {
    user,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    isAuthenticated: true,
    provider: "memory",
  };
  let profile: FoundationProfile = {
    ...demoProfiles[0],
    followerCount: 12,
    followingCount: 3,
  };
  let people = [...demoProfiles];
  let relationships: ProfileRelationshipState = {
    followingUserIds: [],
    blockedUserIds: [],
  };
  let notifications = createNotificationsPageData();
  let settings = defaultAppSettings;
  let uploads: FoundationUploadItem[] = [];
  let rowId = 0;

  return {
    getSession: () => session,
    getAuthState: () => ({
      status: session?.isAuthenticated ? "authenticated" : "unauthenticated",
      session,
      error: null,
    }),
    login: () => {
      session = {
        user,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isAuthenticated: true,
        provider: "memory",
      };
    },
    logout: () => {
      session = null;
    },
    refreshSession: () => session,
    register: (input) => {
      session = {
        user: {
          ...user,
          email: input.email,
          displayName: input.displayName,
        },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isAuthenticated: true,
        provider: "memory",
      };
      return session;
    },
    getProfile: () => profile,
    updateProfile: (input) => {
      profile = { ...profile, ...input };
      return profile;
    },
    listPeople: () => people,
    getRelationshipState: () => relationships,
    followPerson: (userId) => {
      relationships = followProfile(relationships, userId);
      return relationships;
    },
    unfollowPerson: (userId) => {
      relationships = unfollowProfile(relationships, userId);
      return relationships;
    },
    blockPerson: (userId) => {
      relationships = blockProfile(relationships, userId);
      return relationships;
    },
    unblockPerson: (userId) => {
      relationships = unblockProfile(relationships, userId);
      return relationships;
    },
    getNotifications: () => notifications,
    markNotificationRead: (notificationId) => {
      notifications = markNotificationRead(notifications, notificationId);
      return notifications;
    },
    markAllNotificationsRead: () => {
      notifications = markAllNotificationsRead(notifications);
      return notifications;
    },
    getSettings: () => settings,
    updateSettings: (partial) => {
      settings = normalizeAppSettings({ ...settings, ...partial });
      return settings;
    },
    submitReportProblem: () => ({ referenceId: createProblemReferenceId(new Date("2026-04-20T09:35:00.000Z")) }),
    getDataEntryTables: (role) => getTablePermissionViews(role ?? options.role ?? "USER"),
    createDataEntryRow: (table) => ({ id: `${table.table}-${++rowId}` }),
    getUploads: () => uploads,
    addUploadSample: (item) => {
      const nextItem: FoundationUploadItem = {
        id: item?.id ?? `upload-${uploads.length + 1}`,
        name: item?.name ?? "sample.pdf",
        mimeType: item?.mimeType ?? "application/pdf",
        sizeInBytes: item?.sizeInBytes ?? 1024,
        source: item?.source ?? "memory",
        status: item?.status ?? "queued",
      };
      uploads = [...uploads, nextItem];
      return uploads;
    },
  };
}

function renderRoute(routeId: FoundationRouteId) {
  switch (routeId) {
    case "auth":
      return <AuthScreen />;
    case "profile":
      return <ProfileScreen />;
    case "people":
      return <PeopleScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "report-problem":
      return <ReportProblemScreen />;
    case "data-entry":
      return <DataEntryScreen />;
    case "uploads":
      return <UploadsScreen />;
  }
}

function renderFoundationLink(runtime: FoundationRuntime, props: PlatformNavbarRenderLinkProps) {
  const routeId = props.id as FoundationRouteId;
  const onClick = () => {
    props.onClick();
    runtime.navigate(routeId);
  };

  if (runtime.renderLink) {
    return runtime.renderLink({
      routeId,
      href: props.href ?? `#${routeId}`,
      className: props.className,
      children: props.children,
      "aria-current": props["aria-current"],
      onClick,
    });
  }

  return (
    <a href={props.href ?? `#${routeId}`} className={props.className} aria-current={props["aria-current"]} onClick={onClick}>
      {props.children}
    </a>
  );
}

function resolveLabels(labels?: FoundationLabels): ResolvedFoundationLabels {
  return {
    appName: labels?.appName ?? defaultLabels.appName,
    routes: { ...defaultLabels.routes, ...labels?.routes },
    common: { ...defaultLabels.common, ...labels?.common },
    auth: { ...defaultLabels.auth, ...labels?.auth },
    profile: { ...defaultLabels.profile, ...labels?.profile },
    people: { ...defaultLabels.people, ...labels?.people },
    notifications: { ...defaultLabels.notifications, ...labels?.notifications },
    settings: { ...defaultLabels.settings, ...labels?.settings },
    reportProblem: { ...defaultLabels.reportProblem, ...labels?.reportProblem },
    dataEntry: { ...defaultLabels.dataEntry, ...labels?.dataEntry },
    uploads: { ...defaultLabels.uploads, ...labels?.uploads },
  };
}

function getEnabledRoutes(runtime: FoundationRuntime) {
  return routeOrder.filter((routeId) => runtime.capabilities?.[routeCapabilities[routeId]] !== false);
}

async function readAuthState(backend: FoundationBackend): Promise<AuthState> {
  if (backend.getAuthState) {
    return backend.getAuthState();
  }

  const session = await backend.getSession();
  return {
    status: session?.isAuthenticated ? "authenticated" : "unauthenticated",
    session,
    error: null,
  };
}

function defaultProfile(): FoundationProfile {
  return {
    ...demoProfiles[0],
    followerCount: 0,
    followingCount: 0,
  };
}

function Screen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <header>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article style={panelStyle}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function InputField({
  name,
  label,
  type = "text",
  error,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} />
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

const shellStyle: React.CSSProperties = {
  display: "grid",
  gap: 24,
  minHeight: "100vh",
  padding: 24,
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1120,
  width: "100%",
  margin: "0 auto",
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const panelStyle: React.CSSProperties = {
  border: "1px solid currentColor",
  borderRadius: 8,
  padding: 16,
};
