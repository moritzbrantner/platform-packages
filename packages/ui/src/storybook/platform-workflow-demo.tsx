import * as React from "react";
import {
  BellIcon,
  BookOpenIcon,
  HomeIcon,
  KeyRoundIcon,
  LogInIcon,
  MessageCircleIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Avatar } from "../components/avatar";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/card";
import {
  Chat,
  ChatActions,
  ChatBubble,
  ChatComposer,
  ChatComposerInput,
  ChatDescription,
  ChatHeader,
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
  ChatMessageMeta,
  ChatSendButton,
  ChatThread,
  ChatTitle,
} from "../components/chat";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { PlatformNavbar, type PlatformNavbarGroup } from "../components/platform-navbar";
import { Separator } from "../components/separator";
import { Textarea } from "../components/textarea";

export type WorkflowRoute =
  | "main"
  | "about"
  | "login"
  | "register"
  | "password"
  | "home"
  | "social"
  | "people"
  | "profile"
  | "followers"
  | "chats"
  | "chat"
  | "notifications"
  | "settings";

export type WorkflowSessionState = "visitor" | "authenticated";

export type WorkflowAppState = {
  route: WorkflowRoute;
  session: WorkflowSessionState;
  selectedProfileId: string;
  followingIds: string[];
  notice: string | null;
};

export type WorkflowActions = {
  navigate: (route: WorkflowRoute) => void;
  signIn: (email: string) => void;
  registerAccount: (name: string, email: string) => void;
  requestPasswordReset: (email: string) => void;
  openProfile: (personId: string) => void;
  openChat: (personId: string) => void;
  toggleFollow: (personId: string) => void;
  signOut: () => void;
};

export type WorkflowScenario = {
  name: string;
  initialRoute: WorkflowRoute;
  initialSession: WorkflowSessionState;
  initialProfileId?: string;
};

type Person = {
  id: string;
  name: string;
  initials: string;
  headline: string;
  location: string;
  bio: string;
  followers: number;
  following: boolean;
  online: boolean;
};

export type PlatformWorkflowDemoProps = {
  initialRoute?: WorkflowRoute;
  initialSession?: WorkflowSessionState;
  initialProfileId?: string;
  visitorNavigationLabel?: React.ReactNode;
};

const people: Person[] = [
  {
    id: "mira",
    name: "Mira Patel",
    initials: "MP",
    headline: "Product systems lead",
    location: "Berlin",
    bio: "Builds reusable workflow surfaces for account, messaging, and profile journeys.",
    followers: 1280,
    following: false,
    online: true,
  },
  {
    id: "jordan",
    name: "Jordan Ellis",
    initials: "JE",
    headline: "Community designer",
    location: "Lisbon",
    bio: "Documents social flows, moderation states, and collaboration handoffs.",
    followers: 934,
    following: false,
    online: true,
  },
  {
    id: "sofia",
    name: "Sofia Nguyen",
    initials: "SN",
    headline: "Frontend engineer",
    location: "Remote",
    bio: "Maintains typed package examples and verifies cross-theme behavior.",
    followers: 641,
    following: true,
    online: false,
  },
];

const defaultFollowingIds = people.filter((person) => person.following).map((person) => person.id);

const publicRoutes = new Set<WorkflowRoute>(["main", "about", "login", "register", "password"]);

export const workflowRouteOptions = [
  "main",
  "about",
  "login",
  "register",
  "password",
  "home",
  "social",
  "people",
  "profile",
  "followers",
  "chats",
  "chat",
  "notifications",
  "settings",
] as const satisfies WorkflowRoute[];

export const workflowSessionOptions = [
  "visitor",
  "authenticated",
] as const satisfies WorkflowSessionState[];

export const workflowProfileIdOptions = people.map((person) => person.id);

export const workflowScenarios = {
  mainToAbout: {
    name: "Main to about",
    initialRoute: "main",
    initialSession: "visitor",
  },
  mainToLoginToHome: {
    name: "Main to login to home",
    initialRoute: "main",
    initialSession: "visitor",
  },
  mainToRegisterToHome: {
    name: "Main to register to home",
    initialRoute: "main",
    initialSession: "visitor",
  },
  mainToPasswordRecovery: {
    name: "Main to password recovery",
    initialRoute: "main",
    initialSession: "visitor",
  },
  homeToPeopleToProfileToChat: {
    name: "Home to people to profile to chat",
    initialRoute: "home",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
  homeToSocialToFollowers: {
    name: "Home to social to followers",
    initialRoute: "home",
    initialSession: "authenticated",
    initialProfileId: "sofia",
  },
  homeToSettingsSave: {
    name: "Home to settings save",
    initialRoute: "home",
    initialSession: "authenticated",
    initialProfileId: "mira",
  },
} satisfies Record<string, WorkflowScenario>;

const workflowRouteSlugs = {
  main: "",
  about: "about",
  login: "login",
  register: "register",
  password: "password",
  home: "home",
  social: "social",
  people: "people",
  profile: "profile",
  followers: "followers",
  chats: "chats",
  chat: "chat",
  notifications: "notifications",
  settings: "settings",
} satisfies Record<WorkflowRoute, string>;

function buildWorkflowHref(languageCode: string, route: WorkflowRoute) {
  const normalizedLanguageCode = languageCode.trim().toLowerCase() || "en";
  const slug = workflowRouteSlugs[route];

  return slug ? `/${normalizedLanguageCode}/${slug}` : `/${normalizedLanguageCode}/`;
}

function isPublicRoute(route: WorkflowRoute) {
  return publicRoutes.has(route);
}

function normalizeRouteForSession(
  route: WorkflowRoute,
  session: WorkflowSessionState,
): WorkflowRoute {
  if (session === "visitor") {
    return isPublicRoute(route) ? route : "main";
  }

  return isPublicRoute(route) ? "home" : route;
}

function createVisitorNavigationGroups(
  activeRoute: WorkflowRoute,
  languageCode: string,
  visitorNavigationLabel: React.ReactNode,
): PlatformNavbarGroup[] {
  return [
    {
      id: "discover",
      // Placeholder copy so consuming apps can swap this label for their own information architecture.
      label: visitorNavigationLabel,
      eyebrow: "Public",
      description: "Shared entry points for visitors.",
      icon: <HomeIcon className="size-4" />,
      items: [
        {
          id: "main",
          label: "Main",
          href: buildWorkflowHref(languageCode, "main"),
          description: "Start from the shared landing page.",
          icon: <HomeIcon className="size-4" />,
          active: activeRoute === "main",
        },
        {
          id: "about",
          label: "About",
          href: buildWorkflowHref(languageCode, "about"),
          description: "Review what the platform workflow demo covers.",
          icon: <BookOpenIcon className="size-4" />,
          active: activeRoute === "about",
        },
      ],
    },
  ];
}

function createAuthenticatedNavigationGroups(
  activeRoute: WorkflowRoute,
  languageCode: string,
): PlatformNavbarGroup[] {
  return [
    {
      id: "workspace",
      label: "Workspace",
      eyebrow: "Dashboard",
      description: "Signed-in landing and workspace preferences.",
      icon: <HomeIcon className="size-4" />,
      items: [
        {
          id: "home",
          label: "Home",
          href: buildWorkflowHref(languageCode, "home"),
          description: "Review activity, social updates, and next actions.",
          icon: <HomeIcon className="size-4" />,
          active: activeRoute === "home",
        },
        {
          id: "settings",
          label: "Settings",
          href: buildWorkflowHref(languageCode, "settings"),
          description: "Adjust workspace notifications and profile defaults.",
          icon: <SettingsIcon className="size-4" />,
          active: activeRoute === "settings",
        },
      ],
    },
    {
      id: "social",
      label: "Social",
      eyebrow: "Directory",
      description: "Discovery, relationships, and public profile flows.",
      icon: <UsersIcon className="size-4" />,
      items: [
        {
          id: "social",
          label: "Overview",
          href: buildWorkflowHref(languageCode, "social"),
          description: "Open the combined social activity hub.",
          icon: <UsersIcon className="size-4" />,
          active: activeRoute === "social",
        },
        {
          id: "people",
          label: "People",
          href: buildWorkflowHref(languageCode, "people"),
          description: "Find and follow platform users.",
          icon: <SearchIcon className="size-4" />,
          active: activeRoute === "people",
        },
        {
          id: "followers",
          label: "Followers",
          href: buildWorkflowHref(languageCode, "followers"),
          description: "Review the profiles you currently follow.",
          icon: <UserPlusIcon className="size-4" />,
          active: activeRoute === "followers",
        },
        {
          id: "profile",
          label: "Profile",
          href: buildWorkflowHref(languageCode, "profile"),
          description: "Review a public profile.",
          icon: <UserCircleIcon className="size-4" />,
          active: activeRoute === "profile",
        },
      ],
    },
    {
      id: "messaging",
      label: "Messaging",
      eyebrow: "Inbox",
      description: "Conversation lists, direct threads, and notification flows.",
      icon: <MessageCircleIcon className="size-4" />,
      items: [
        {
          id: "chats",
          label: "Chat overview",
          href: buildWorkflowHref(languageCode, "chats"),
          description: "Review recent conversations and unread replies.",
          icon: <MessageCircleIcon className="size-4" />,
          active: activeRoute === "chats",
        },
        {
          id: "chat",
          label: "Thread",
          href: buildWorkflowHref(languageCode, "chat"),
          description: "Open a direct message thread.",
          icon: <MessageCircleIcon className="size-4" />,
          badge: "Live",
          active: activeRoute === "chat",
        },
        {
          id: "notifications",
          label: "Notifications",
          href: buildWorkflowHref(languageCode, "notifications"),
          description: "Check social updates and account events.",
          icon: <BellIcon className="size-4" />,
          active: activeRoute === "notifications",
        },
      ],
    },
  ];
}

function getDefaultOpenGroupId(
  session: WorkflowSessionState,
  activeRoute: WorkflowRoute,
): string | null {
  if (session === "visitor") {
    return "discover";
  }

  if (activeRoute === "home" || activeRoute === "settings") {
    return "workspace";
  }

  if (
    activeRoute === "social" ||
    activeRoute === "people" ||
    activeRoute === "profile" ||
    activeRoute === "followers"
  ) {
    return "social";
  }

  return "messaging";
}

export function PlatformWorkflowDemo({
  initialRoute = "main",
  initialSession = "visitor",
  initialProfileId = "mira",
  visitorNavigationLabel = "Discover",
}: PlatformWorkflowDemoProps) {
  const [languageCode, setLanguageCode] = React.useState("en");
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("light");
  const [session, setSession] = React.useState<WorkflowSessionState>(initialSession);
  const [activeRoute, setActiveRoute] = React.useState<WorkflowRoute>(() =>
    normalizeRouteForSession(initialRoute, initialSession),
  );
  const [selectedProfileId, setSelectedProfileId] = React.useState(initialProfileId);
  const [followingIds, setFollowingIds] = React.useState(defaultFollowingIds);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSession(initialSession);
    setActiveRoute(normalizeRouteForSession(initialRoute, initialSession));
    setFollowingIds(defaultFollowingIds);
    setNotice(null);
    setLanguageCode("en");
    setThemeMode("light");
  }, [initialRoute, initialSession]);

  React.useEffect(() => {
    setSelectedProfileId(initialProfileId);
  }, [initialProfileId]);

  const currentHref = buildWorkflowHref(languageCode, activeRoute);
  const selectedProfile =
    people.find((person) => person.id === selectedProfileId) ?? people[0] ?? null;
  const followingCount = followingIds.length;
  const isVisitor = session === "visitor";

  const navigate = React.useCallback(
    (route: WorkflowRoute) => {
      setNotice(null);
      setActiveRoute(normalizeRouteForSession(route, session));
    },
    [session],
  );

  const signIn = React.useCallback((email: string) => {
    setSession("authenticated");
    setNotice(`Signed in as ${email}`);
    setActiveRoute("home");
  }, []);

  const registerAccount = React.useCallback((name: string, email: string) => {
    setSession("authenticated");
    setNotice(`Workspace profile created for ${name || email}`);
    setActiveRoute("home");
  }, []);

  const requestPasswordReset = React.useCallback((email: string) => {
    setSession("visitor");
    setNotice(`Reset link sent to ${email}`);
    setActiveRoute("password");
  }, []);

  const openProfile = React.useCallback((personId: string) => {
    setNotice(null);
    setSelectedProfileId(personId);
    setActiveRoute("profile");
  }, []);

  const openChat = React.useCallback((personId: string) => {
    setNotice(null);
    setSelectedProfileId(personId);
    setActiveRoute("chat");
  }, []);

  const toggleFollow = React.useCallback((personId: string) => {
    setFollowingIds((current) =>
      current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    );
  }, []);

  const signOut = React.useCallback(() => {
    setSession("visitor");
    setNotice("Signed out to the public workflow.");
    setActiveRoute("main");
  }, []);

  const actions: WorkflowActions = {
    navigate,
    signIn,
    registerAccount,
    requestPasswordReset,
    openProfile,
    openChat,
    toggleFollow,
    signOut,
  };

  const groups = isVisitor
    ? createVisitorNavigationGroups(activeRoute, languageCode, visitorNavigationLabel)
    : createAuthenticatedNavigationGroups(activeRoute, languageCode);

  return (
    <div
      lang={languageCode}
      data-language-code={languageCode}
      data-theme={themeMode}
      className={themeMode === "dark" ? "dark" : undefined}
    >
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <PlatformNavbar
          brand={
            <span className="inline-flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                P
              </span>
              Platform
            </span>
          }
          groups={groups}
          activeItemId={activeRoute}
          defaultOpenGroupId={getDefaultOpenGroupId(session, activeRoute)}
          languageSwitcher={{
            value: languageCode,
            onValueChange: (nextLanguageCode) => {
              setLanguageCode(nextLanguageCode);
            },
          }}
          themeModeSwitch={{
            mode: themeMode,
            onModeChange: setThemeMode,
          }}
          actions={
            isVisitor ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => navigate("login")}>
                  <LogInIcon />
                  Login
                </Button>
                <Button type="button" size="sm" onClick={() => navigate("register")}>
                  <UserPlusIcon />
                  Create account
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={activeRoute === "chat" ? "secondary" : "outline"}
                  onClick={() => openChat(selectedProfile?.id ?? "mira")}
                >
                  <MessageCircleIcon />
                  Chat
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={signOut}>
                  <LogInIcon />
                  Sign out
                </Button>
              </div>
            )
          }
          onNavigate={(item) => navigate(item.id as WorkflowRoute)}
          renderLink={({ className, children, href, onClick, "aria-current": ariaCurrent }) => (
            <a
              href={href}
              className={className}
              aria-current={ariaCurrent}
              onClick={(event) => {
                event.preventDefault();
                onClick();
              }}
            >
              {children}
            </a>
          )}
        />

        <main className="grid gap-6">
          <WorkflowEnvironmentSummary
            currentHref={currentHref}
            languageCode={languageCode}
            themeMode={themeMode}
          />
          {isVisitor ? (
            <VisitorSummary />
          ) : (
            <WorkflowSummary followingCount={followingCount} selectedProfile={selectedProfile} />
          )}

          {notice ? <WorkflowNotice message={notice} /> : null}

          <WorkflowScreen
            actions={actions}
            route={activeRoute}
            selectedProfile={selectedProfile}
            followingCount={followingCount}
            followingIds={followingIds}
            onNotice={setNotice}
          />
        </main>
        </div>
      </div>
    </div>
  );
}

function WorkflowEnvironmentSummary({
  currentHref,
  languageCode,
  themeMode,
}: {
  currentHref: string;
  languageCode: string;
  themeMode: "light" | "dark";
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Current URL</p>
        <p className="mt-1 break-all font-mono text-sm font-semibold">{currentHref}</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Language</p>
        <p className="mt-1 text-2xl font-semibold uppercase">{languageCode}</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Appearance</p>
        <p className="mt-1 text-2xl font-semibold capitalize">{themeMode} mode</p>
      </div>
    </section>
  );
}

function WorkflowScreen({
  actions,
  route,
  selectedProfile,
  followingCount,
  followingIds,
  onNotice,
}: {
  actions: WorkflowActions;
  route: WorkflowRoute;
  selectedProfile: Person | null;
  followingCount: number;
  followingIds: string[];
  onNotice: (message: string) => void;
}) {
  if (route === "main") {
    return <MainScreen onNavigate={actions.navigate} />;
  }

  if (route === "about") {
    return <AboutScreen onNavigate={actions.navigate} />;
  }

  if (route === "login") {
    return <LoginScreen onNavigate={actions.navigate} onSignIn={actions.signIn} />;
  }

  if (route === "register") {
    return <RegisterScreen onNavigate={actions.navigate} onRegister={actions.registerAccount} />;
  }

  if (route === "password") {
    return (
      <PasswordRecoveryScreen
        onNavigate={actions.navigate}
        onRequestPasswordReset={actions.requestPasswordReset}
      />
    );
  }

  if (route === "home") {
    return <HomeScreen followingCount={followingCount} onNavigate={actions.navigate} />;
  }

  if (route === "social") {
    return <SocialOverviewScreen followingCount={followingCount} onNavigate={actions.navigate} />;
  }

  if (route === "people") {
    return (
      <PeopleScreen
        followingIds={followingIds}
        onOpenChat={actions.openChat}
        onOpenProfile={actions.openProfile}
        onToggleFollow={actions.toggleFollow}
      />
    );
  }

  if (route === "profile" && selectedProfile) {
    return (
      <ProfileScreen
        isFollowing={followingIds.includes(selectedProfile.id)}
        person={selectedProfile}
        onOpenChat={actions.openChat}
        onToggleFollow={actions.toggleFollow}
      />
    );
  }

  if (route === "followers") {
    return (
      <FollowersScreen
        followingIds={followingIds}
        onNavigate={actions.navigate}
        onOpenChat={actions.openChat}
        onOpenProfile={actions.openProfile}
        onToggleFollow={actions.toggleFollow}
      />
    );
  }

  if (route === "chats") {
    return <ChatOverviewScreen onOpenChat={actions.openChat} selectedProfile={selectedProfile} />;
  }

  if (route === "chat" && selectedProfile) {
    return <ChatScreen person={selectedProfile} />;
  }

  if (route === "notifications") {
    return <NotificationsScreen followingCount={followingCount} />;
  }

  return <SettingsScreen onNotice={onNotice} />;
}

function VisitorSummary() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Workflow mode</p>
        <p className="mt-1 text-2xl font-semibold">Visitor</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Shared screens</p>
        <p className="mt-1 text-2xl font-semibold">About + Auth</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Next branch</p>
        <p className="mt-1 text-2xl font-semibold">Login or explore</p>
      </div>
    </section>
  );
}

function MainScreen({ onNavigate }: { onNavigate: (route: WorkflowRoute) => void }) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-4 rounded-xl border bg-card p-6 text-card-foreground lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3">
          <Badge variant="outline" className="w-fit">
            Public entry
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Main page</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Start from a shared public landing page, then branch into the about page, login,
            account creation, or password recovery without leaving the same Storybook app state.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => onNavigate("about")}>
              <BookOpenIcon />
              About
            </Button>
            <Button type="button" variant="outline" onClick={() => onNavigate("login")}>
              <LogInIcon />
              Login
            </Button>
            <Button type="button" variant="ghost" onClick={() => onNavigate("register")}>
              <UserPlusIcon />
              Create account
            </Button>
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-lg border bg-muted/35 p-4">
          <h2 className="text-base font-medium">Story coverage</h2>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>Shared public entry points plus separate account actions in the navbar.</p>
            <p>Authenticated routes for home, social, messages, notifications, and settings.</p>
            <p>Persistent in-memory state for follows, selected profiles, and notices.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          title="About"
          description="Use the same about page from the main entry or from deeper visitor flows."
          actionLabel="Open about page"
          onAction={() => onNavigate("about")}
        />
        <OverviewCard
          title="Login"
          description="Continue with an existing account and land in the signed-in workspace."
          actionLabel="Open login"
          onAction={() => onNavigate("login")}
        />
        <OverviewCard
          title="Register"
          description="Create a new account and reuse the same workspace screens after signup."
          actionLabel="Create account"
          onAction={() => onNavigate("register")}
        />
      </div>
    </section>
  );
}

function AboutScreen({ onNavigate }: { onNavigate: (route: WorkflowRoute) => void }) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-4 rounded-xl border bg-card p-6 text-card-foreground lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3">
          <Badge variant="outline" className="w-fit">
            Public information
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">About</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This Storybook workflow demonstrates how the same screens can be composed into multiple
            paths, including public discovery, authentication, and signed-in collaboration flows.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => onNavigate("main")}>
              <HomeIcon />
              Back to main
            </Button>
            <Button type="button" variant="outline" onClick={() => onNavigate("login")}>
              <LogInIcon />
              Login
            </Button>
            <Button type="button" variant="ghost" onClick={() => onNavigate("register")}>
              <UserPlusIcon />
              Register
            </Button>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/35 p-4">
          <h2 className="text-base font-medium">Included paths</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>Main to about.</li>
            <li>Main to login or registration.</li>
            <li>Authenticated branching into people, profile, chat, followers, and settings.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function WorkflowSummary({
  followingCount,
  selectedProfile,
}: {
  followingCount: number;
  selectedProfile: Person | null;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Signed-in workspace</p>
        <p className="mt-1 text-2xl font-semibold">Platform</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Following</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{followingCount}</p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">Active profile</p>
        <p className="mt-1 truncate text-2xl font-semibold">{selectedProfile?.name ?? "None"}</p>
      </div>
    </section>
  );
}

function WorkflowNotice({ message }: { message: string }) {
  return (
    <Alert className="max-w-3xl">
      <SendIcon />
      <AlertTitle>Workflow update</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function LoginScreen({
  onNavigate,
  onSignIn,
}: {
  onNavigate: (route: WorkflowRoute) => void;
  onSignIn: (email: string) => void;
}) {
  const [email, setEmail] = React.useState("mira@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <CardDescription>
          Continue recent workspace activity with an existing account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSignIn(email);
          }}
        >
          <Field label="Email" id="workflow-login-email">
            <Input
              id="workflow-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password" id="workflow-login-password">
            <Input id="workflow-login-password" type="password" />
          </Field>
          <Button type="submit" className="w-fit">
            <LogInIcon />
            Sign in
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => onNavigate("register")}>
          <UserPlusIcon />
          Create account instead
        </Button>
        <Button type="button" variant="outline" onClick={() => onNavigate("password")}>
          <KeyRoundIcon />
          Forgot password?
        </Button>
      </CardFooter>
    </Card>
  );
}

function RegisterScreen({
  onNavigate,
  onRegister,
}: {
  onNavigate: (route: WorkflowRoute) => void;
  onRegister: (name: string, email: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("new-user@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <h1 className="text-2xl font-semibold tracking-tight">Register</h1>
        <CardDescription>Create a platform profile for team collaboration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onRegister(name, email);
          }}
        >
          <Field label="Display name" id="workflow-register-name">
            <Input
              id="workflow-register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Work email" id="workflow-register-email">
            <Input
              id="workflow-register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-fit">
            <UserPlusIcon />
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <span className="text-sm text-muted-foreground">Already have a workspace profile?</span>
        <Button type="button" variant="ghost" onClick={() => onNavigate("login")}>
          <LogInIcon />
          Sign in instead
        </Button>
      </CardFooter>
    </Card>
  );
}

function PasswordRecoveryScreen({
  onNavigate,
  onRequestPasswordReset,
}: {
  onNavigate: (route: WorkflowRoute) => void;
  onRequestPasswordReset: (email: string) => void;
}) {
  const [email, setEmail] = React.useState("mira@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <h1 className="text-2xl font-semibold tracking-tight">Password forgotten</h1>
        <CardDescription>Request a recovery email for a locked-out account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onRequestPasswordReset(email);
          }}
        >
          <Field label="Recovery email" id="workflow-password-email">
            <Input
              id="workflow-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-fit">
            <KeyRoundIcon />
            Send reset link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <span className="text-sm text-muted-foreground">Remembered your credentials?</span>
        <Button type="button" variant="ghost" onClick={() => onNavigate("login")}>
          <LogInIcon />
          Back to sign in
        </Button>
      </CardFooter>
    </Card>
  );
}

function HomeScreen({
  followingCount,
  onNavigate,
}: {
  followingCount: number;
  onNavigate: (route: WorkflowRoute) => void;
}) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-4 rounded-xl border bg-card p-6 text-card-foreground lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3">
          <Badge variant="outline" className="w-fit">
            Workspace home
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Start from a signed-in dashboard with quick access to social discovery, active
            conversations, and workspace settings.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => onNavigate("social")}>
              <UsersIcon />
              Open social overview
            </Button>
            <Button type="button" variant="outline" onClick={() => onNavigate("chats")}>
              <MessageCircleIcon />
              Open chat overview
            </Button>
            <Button type="button" variant="ghost" onClick={() => onNavigate("settings")}>
              <SettingsIcon />
              Open settings
            </Button>
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-lg border bg-muted/35 p-4">
          <h2 className="text-base font-medium">Today</h2>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>2 direct messages need a reply.</p>
            <p>{followingCount} followed profiles posted updates this morning.</p>
            <p>Notifications and password recovery are configured for this workspace.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Social pulse</CardTitle>
            <CardDescription>People discovery, follows, and profile reviews.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Browse the wider directory or focus on the followed profiles that matter most.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => onNavigate("followers")}
            >
              <UserPlusIcon />
              Open followers overview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation queue</CardTitle>
            <CardDescription>Recent replies and direct-message handoffs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Review open chat threads before switching into a focused conversation.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => onNavigate("chats")}
            >
              <MessageCircleIcon />
              Review chats
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace controls</CardTitle>
            <CardDescription>Preferences, delivery settings, and profile defaults.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Adjust notifications, session behavior, and saved profile details.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => onNavigate("settings")}
            >
              <SettingsIcon />
              Manage settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SocialOverviewScreen({
  followingCount,
  onNavigate,
}: {
  followingCount: number;
  onNavigate: (route: WorkflowRoute) => void;
}) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Social overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A single entry point for directory discovery, followed profiles, public profile review,
            and message handoff workflows.
          </p>
        </div>
        <Badge variant="outline">{followingCount} followed profiles</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          title="People directory"
          description="Browse all platform profiles and jump into a profile or thread."
          actionLabel="Open people"
          onAction={() => onNavigate("people")}
        />
        <OverviewCard
          title="Followers"
          description="Review the people you already follow and adjust the list in one place."
          actionLabel="Open followers overview"
          onAction={() => onNavigate("followers")}
        />
        <OverviewCard
          title="Chat inbox"
          description="Switch from social discovery into recent conversations without losing context."
          actionLabel="Open chat overview"
          onAction={() => onNavigate("chats")}
        />
        <OverviewCard
          title="Notifications"
          description="Check follows, replies, and account events from the same signed-in flow."
          actionLabel="Open notifications"
          onAction={() => onNavigate("notifications")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent social signals</CardTitle>
          <CardDescription>Representative activity for this Storybook workflow demo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            "Mira Patel shared a systems note for the onboarding flow.",
            "Jordan Ellis replied to a collaboration thread and is available to chat.",
            "Sofia Nguyen published a frontend update and remains in your followed list.",
          ].map((message) => (
            <div key={message} className="rounded-lg border bg-muted/35 px-4 py-3 text-sm">
              {message}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function PeopleScreen({
  followingIds,
  onOpenChat,
  onOpenProfile,
  onToggleFollow,
}: {
  followingIds: string[];
  onOpenChat: (personId: string) => void;
  onOpenProfile: (personId: string) => void;
  onToggleFollow: (personId: string) => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">People</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            People connected to recent workspace activity and collaboration reviews.
          </p>
        </div>
        <Badge variant="outline">{people.length} profiles</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {people.map((person) => {
          const isFollowing = followingIds.includes(person.id);

          return (
            <PersonCard
              key={person.id}
              isFollowing={isFollowing}
              person={person}
              onOpenChat={onOpenChat}
              onOpenProfile={onOpenProfile}
              onToggleFollow={onToggleFollow}
            />
          );
        })}
      </div>
    </section>
  );
}

function PersonCard({
  isFollowing,
  person,
  onOpenChat,
  onOpenProfile,
  onToggleFollow,
}: {
  isFollowing: boolean;
  person: Person;
  onOpenChat: (personId: string) => void;
  onOpenProfile: (personId: string) => void;
  onToggleFollow: (personId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg" initials={person.initials} name={person.name} online={person.online} />
          <div className="min-w-0">
            <CardTitle className="truncate">{person.name}</CardTitle>
            <CardDescription className="truncate">{person.headline}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant={isFollowing ? "secondary" : "outline"}>
            {isFollowing ? "Following" : "New"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm leading-6 text-muted-foreground">{person.bio}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{person.location}</span>
          <span>{person.followers.toLocaleString()} followers</span>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${person.name}`}
          onClick={() => onToggleFollow(person.id)}
        >
          <UserPlusIcon />
          {isFollowing ? "Following" : "Follow"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Open ${person.name} profile`}
          onClick={() => onOpenProfile(person.id)}
        >
          <UserCircleIcon />
          Profile
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={`Open chat with ${person.name}`}
          onClick={() => onOpenChat(person.id)}
        >
          <MessageCircleIcon />
          Chat
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProfileScreen({
  isFollowing,
  person,
  onOpenChat,
  onToggleFollow,
}: {
  isFollowing: boolean;
  person: Person;
  onOpenChat: (personId: string) => void;
  onToggleFollow: (personId: string) => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              size="lg"
              className="size-14"
              initials={person.initials}
              name={person.name}
              online={person.online}
            />
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold tracking-tight">{person.name}</h1>
              <p className="mt-1 text-muted-foreground">{person.headline}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${person.name}`}
              onClick={() => onToggleFollow(person.id)}
            >
              <UserPlusIcon />
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChat(person.id)}>
              <MessageCircleIcon />
              Open chat
            </Button>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="grid gap-4 sm:grid-cols-3">
          <ProfileMetric label="Location" value={person.location} />
          <ProfileMetric label="Followers" value={person.followers.toLocaleString()} />
          <ProfileMetric label="Status" value={person.online ? "Online" : "Away"} />
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{person.bio}</p>
      </div>

      <div className="rounded-lg border bg-muted/35 p-4">
        <h2 className="text-base font-medium">Profile notes</h2>
        <Textarea
          className="mt-3 min-h-32"
          aria-label="Profile notes"
          defaultValue={`${person.name} is available for a workflow review this week.`}
        />
      </div>
    </section>
  );
}

function FollowersScreen({
  followingIds,
  onNavigate,
  onOpenChat,
  onOpenProfile,
  onToggleFollow,
}: {
  followingIds: string[];
  onNavigate: (route: WorkflowRoute) => void;
  onOpenChat: (personId: string) => void;
  onOpenProfile: (personId: string) => void;
  onToggleFollow: (personId: string) => void;
}) {
  const followedPeople = people.filter((person) => followingIds.includes(person.id));

  if (followedPeople.length === 0) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Followers overview</CardTitle>
          <CardDescription>No followed profiles yet.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Start from the people directory to build a list of profiles to watch.
          </p>
          <Button type="button" className="w-fit" onClick={() => onNavigate("people")}>
            <SearchIcon />
            Browse people
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Followers overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Profiles you already follow, with direct access to profile review and chat.
          </p>
        </div>
        <Badge variant="outline">{followedPeople.length} active follows</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {followedPeople.map((person) => (
          <PersonCard
            key={person.id}
            isFollowing
            person={person}
            onOpenChat={onOpenChat}
            onOpenProfile={onOpenProfile}
            onToggleFollow={onToggleFollow}
          />
        ))}
      </div>
    </section>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function ChatScreen({ person }: { person: Person }) {
  const [draft, setDraft] = React.useState("Can you review the new workflow stories?");
  const [sentMessage, setSentMessage] = React.useState<string | null>(null);

  return (
    <Chat className="min-h-[36rem]">
      <ChatHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar initials={person.initials} name={person.name} online={person.online} />
          <div className="min-w-0">
            <ChatTitle>Chat with {person.name}</ChatTitle>
            <ChatDescription>
              {person.online ? "Online now" : "Last active yesterday"}
            </ChatDescription>
          </div>
        </div>
        <ChatActions>
          <Badge variant={person.online ? "secondary" : "outline"}>
            {person.online ? "Active" : "Away"}
          </Badge>
        </ChatActions>
      </ChatHeader>
      <ChatThread>
        <ChatMessage>
          <ChatMessageAvatar>{person.initials}</ChatMessageAvatar>
          <ChatMessageContent>
            <ChatMessageMeta>{person.name}, 09:30</ChatMessageMeta>
            <ChatBubble>I can look at the social flow after lunch.</ChatBubble>
          </ChatMessageContent>
        </ChatMessage>
        <ChatMessage align="end">
          <ChatMessageContent>
            <ChatMessageMeta>You, 09:33</ChatMessageMeta>
            <ChatBubble>The account and people flows are ready for review.</ChatBubble>
          </ChatMessageContent>
        </ChatMessage>
        {sentMessage ? (
          <ChatMessage align="end">
            <ChatMessageContent>
              <ChatMessageMeta>You, now</ChatMessageMeta>
              <ChatBubble>{sentMessage}</ChatBubble>
            </ChatMessageContent>
          </ChatMessage>
        ) : null}
      </ChatThread>
      <ChatComposer
        onSubmit={(event) => {
          event.preventDefault();
          setSentMessage(draft);
          setDraft("");
        }}
      >
        <ChatComposerInput
          aria-label="Message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <ChatSendButton />
      </ChatComposer>
    </Chat>
  );
}

function ChatOverviewScreen({
  onOpenChat,
  selectedProfile,
}: {
  onOpenChat: (personId: string) => void;
  selectedProfile: Person | null;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chat overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Move from a conversation list into a direct thread without leaving the signed-in
            workflow demo.
          </p>
        </div>
        <Badge variant="outline">3 recent threads</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_22rem]">
        <div className="grid gap-3">
          {people.map((person, index) => {
            const unread = index === 0 ? 2 : index === 1 ? 1 : 0;

            return (
              <Card key={person.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="lg"
                      initials={person.initials}
                      name={person.name}
                      online={person.online}
                    />
                    <div className="min-w-0">
                      <CardTitle className="truncate">{person.name}</CardTitle>
                      <CardDescription className="truncate">
                        {person.online ? "Available now" : "Away"} - Last note on social workflow
                        handoff
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction>
                    <Badge variant={unread > 0 ? "secondary" : "outline"}>
                      {unread > 0 ? `${unread} unread` : "Read"}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-muted-foreground">
                    {index === 0
                      ? "Can you review the new workflow stories before the visual pass?"
                      : index === 1
                        ? "I added the profile and followers states for Storybook."
                        : "The account and social surfaces are ready for review."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    aria-label={`Open chat with ${person.name}`}
                    onClick={() => onOpenChat(person.id)}
                  >
                    <MessageCircleIcon />
                    Open thread
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current focus</CardTitle>
            <CardDescription>
              {selectedProfile ? `Ready to continue with ${selectedProfile.name}.` : "Select a thread."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Unread replies, followed profiles, and direct threads stay connected in this workflow.</p>
            <p>Jumping into a thread keeps the selected profile aligned with the rest of the social flow.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function NotificationsScreen({ followingCount }: { followingCount: number }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        {[
          "Mira Patel accepted your profile review request.",
          "Jordan Ellis sent a chat reply in Platform Workflows.",
          `${followingCount} followed profiles have updates ready.`,
        ].map((message) => (
          <div key={message} className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
            {message}
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-muted/35 p-4">
        <h2 className="text-base font-medium">Delivery</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Email, in-app, and direct-message updates are enabled for this workspace.
        </p>
      </div>
    </section>
  );
}

function SettingsScreen({ onNotice }: { onNotice: (message: string) => void }) {
  const [displayName, setDisplayName] = React.useState("Platform reviewer");
  const [email, setEmail] = React.useState("reviewer@example.com");

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_22rem]">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <CardDescription>Workspace preferences for profile, delivery, and review defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              onNotice(`Settings saved for ${displayName || email}`);
            }}
          >
            <Field label="Display name" id="workflow-settings-name">
              <Input
                id="workflow-settings-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>
            <Field label="Email" id="workflow-settings-email">
              <Input
                id="workflow-settings-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Status message" id="workflow-settings-status">
              <Textarea
                id="workflow-settings-status"
                defaultValue="Available for UI workflow reviews this afternoon."
              />
            </Field>
            <Button type="submit" className="w-fit">
              <SettingsIcon />
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included</CardTitle>
          <CardDescription>Primary settings areas covered by this workflow screen.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <div className="rounded-lg border bg-muted/35 px-4 py-3">Profile identity and public status</div>
          <div className="rounded-lg border bg-muted/35 px-4 py-3">Notification and direct-message delivery</div>
          <div className="rounded-lg border bg-muted/35 px-4 py-3">Recovery email and account access controls</div>
        </CardContent>
      </Card>
    </section>
  );
}

function OverviewCard({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" className="w-fit" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
