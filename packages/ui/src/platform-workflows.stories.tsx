import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BellIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  LogInIcon,
  MessageCircleIcon,
  SearchIcon,
  SendIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { expect } from "storybook/test";

import { Alert, AlertDescription, AlertTitle } from "./components/alert";
import { Avatar } from "./components/avatar";
import { Badge } from "./components/badge";
import { Button } from "./components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
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
} from "./components/chat";
import { Input } from "./components/input";
import { Label } from "./components/label";
import { PlatformNavbar, type PlatformNavbarGroup } from "./components/platform-navbar";
import { Separator } from "./components/separator";
import { Textarea } from "./components/textarea";
import { cn } from "./lib/cn";

type WorkflowRoute =
  | "login"
  | "register"
  | "password"
  | "people"
  | "profile"
  | "chat"
  | "notifications";

type PlatformWorkflowDemoProps = {
  initialRoute?: WorkflowRoute;
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

const workflowNavigationGroups = [
  {
    id: "access",
    label: "Access",
    eyebrow: "Account",
    description: "Entry points for signing in and account recovery.",
    icon: <LockKeyholeIcon className="size-4" />,
    items: [
      {
        id: "login",
        label: "Login",
        href: "#login",
        description: "Return to an existing workspace.",
        icon: <LogInIcon className="size-4" />,
      },
      {
        id: "register",
        label: "Register",
        href: "#register",
        description: "Create a workspace profile.",
        icon: <UserPlusIcon className="size-4" />,
      },
      {
        id: "password",
        label: "Password forgotten",
        href: "#password",
        description: "Send a recovery link.",
        icon: <KeyRoundIcon className="size-4" />,
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    eyebrow: "Directory",
    description: "People discovery, follows, and public profiles.",
    icon: <UsersIcon className="size-4" />,
    items: [
      {
        id: "people",
        label: "People",
        href: "#people",
        description: "Find and follow platform users.",
        icon: <SearchIcon className="size-4" />,
      },
      {
        id: "profile",
        label: "Profile",
        href: "#profile",
        description: "Review a public profile.",
        icon: <UserCircleIcon className="size-4" />,
      },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    eyebrow: "Inbox",
    description: "Chat and notification workflows.",
    icon: <MessageCircleIcon className="size-4" />,
    items: [
      {
        id: "chat",
        label: "Chat",
        href: "#chat",
        description: "Open a direct message thread.",
        icon: <MessageCircleIcon className="size-4" />,
        badge: "Live",
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "#notifications",
        description: "Check social updates and account events.",
        icon: <BellIcon className="size-4" />,
      },
    ],
  },
] satisfies PlatformNavbarGroup[];

const meta = {
  title: "Workflows/Platform",
  component: PlatformWorkflowDemo,
  tags: ["autodocs", "test"],
  args: {
    initialRoute: "login",
    initialProfileId: "mira",
  },
  argTypes: {
    initialRoute: {
      control: "select",
      options: ["login", "register", "password", "people", "profile", "chat", "notifications"],
    },
    initialProfileId: {
      control: "select",
      options: people.map((person) => person.id),
    },
  },
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "todo",
    },
  },
} satisfies Meta<typeof PlatformWorkflowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Login: Story = {
  args: { initialRoute: "login" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.clear(canvas.getByLabelText("Email"));
    await userEvent.type(canvas.getByLabelText("Email"), "demo@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "correct-horse");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent("Signed in as demo@example.com");
  },
};

export const Register: Story = {
  args: { initialRoute: "register" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Display name"), "Ada Lovelace");
    await userEvent.clear(canvas.getByLabelText("Work email"));
    await userEvent.type(canvas.getByLabelText("Work email"), "ada@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent("Workspace profile created");
  },
};

export const PasswordForgotten: Story = {
  args: { initialRoute: "password" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.clear(canvas.getByLabelText("Recovery email"));
    await userEvent.type(canvas.getByLabelText("Recovery email"), "reset@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Send reset link" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Reset link sent to reset@example.com",
    );
  },
};

export const OpeningAChat: Story = {
  args: { initialRoute: "people", initialProfileId: "jordan" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open chat with Jordan Ellis" }));

    await expect(canvas.getByRole("heading", { name: "Chat with Jordan Ellis" })).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "Message" })).toBeVisible();
  },
};

export const FollowingAnotherUser: Story = {
  args: { initialRoute: "people", initialProfileId: "mira" },
  play: async ({ canvas, userEvent }) => {
    const followButton = canvas.getByRole("button", { name: "Follow Mira Patel" });

    await userEvent.click(followButton);

    await expect(followButton).toHaveTextContent("Following");
  },
};

export const OpeningAProfile: Story = {
  args: { initialRoute: "people", initialProfileId: "jordan" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open Jordan Ellis profile" }));

    await expect(canvas.getByRole("heading", { name: "Jordan Ellis" })).toBeVisible();
    await expect(canvas.getByText("Community designer")).toBeVisible();
  },
};

export const Notifications: Story = {
  args: { initialRoute: "notifications" },
};

function PlatformWorkflowDemo({
  initialRoute = "login",
  initialProfileId = "mira",
}: PlatformWorkflowDemoProps) {
  const [activeRoute, setActiveRoute] = React.useState<WorkflowRoute>(initialRoute);
  const [selectedProfileId, setSelectedProfileId] = React.useState(initialProfileId);
  const [followingIds, setFollowingIds] = React.useState(() =>
    people.filter((person) => person.following).map((person) => person.id),
  );
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    setActiveRoute(initialRoute);
  }, [initialRoute]);

  React.useEffect(() => {
    setSelectedProfileId(initialProfileId);
  }, [initialProfileId]);

  const selectedProfile =
    people.find((person) => person.id === selectedProfileId) ?? people[0] ?? null;
  const followingCount = followingIds.length;
  const activeItemId = activeRoute;
  const isAuthRoute =
    activeRoute === "login" || activeRoute === "register" || activeRoute === "password";

  const navigate = (route: WorkflowRoute) => {
    setNotice(null);
    setActiveRoute(route);
  };

  const openProfile = (personId: string) => {
    setSelectedProfileId(personId);
    navigate("profile");
  };

  const openChat = (personId: string) => {
    setSelectedProfileId(personId);
    navigate("chat");
  };

  const toggleFollow = (personId: string) => {
    setFollowingIds((current) =>
      current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={cn(
          "mx-auto w-full px-4 py-5 sm:px-6 lg:px-8",
          isAuthRoute
            ? "flex min-h-screen max-w-xl items-center justify-center"
            : "grid max-w-7xl gap-8",
        )}
      >
        {isAuthRoute ? null : (
          <PlatformNavbar
            brand={
              <span className="inline-flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  P
                </span>
                Platform
              </span>
            }
            groups={workflowNavigationGroups.map((group) => ({
              ...group,
              items: group.items.map((item) => ({
                ...item,
                active: item.id === activeItemId,
              })),
            }))}
            activeItemId={activeItemId}
            actions={
              <Button
                type="button"
                size="sm"
                variant={activeRoute === "chat" ? "secondary" : "outline"}
                onClick={() => openChat(selectedProfile?.id ?? "mira")}
              >
                <MessageCircleIcon />
                Chat
              </Button>
            }
            defaultOpenGroupId={null}
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
        )}

        <main className={cn("grid gap-6", isAuthRoute && "w-full")}>
          {isAuthRoute ? null : (
            <WorkflowSummary followingCount={followingCount} selectedProfile={selectedProfile} />
          )}
          {notice ? <WorkflowNotice message={notice} /> : null}
          {activeRoute === "login" ? <LoginWorkflow onNotice={setNotice} /> : null}
          {activeRoute === "register" ? <RegisterWorkflow onNotice={setNotice} /> : null}
          {activeRoute === "password" ? <PasswordWorkflow onNotice={setNotice} /> : null}
          {activeRoute === "people" ? (
            <PeopleWorkflow
              followingIds={followingIds}
              onOpenChat={openChat}
              onOpenProfile={openProfile}
              onToggleFollow={toggleFollow}
            />
          ) : null}
          {activeRoute === "profile" && selectedProfile ? (
            <ProfileWorkflow
              isFollowing={followingIds.includes(selectedProfile.id)}
              person={selectedProfile}
              onOpenChat={openChat}
              onToggleFollow={toggleFollow}
            />
          ) : null}
          {activeRoute === "chat" && selectedProfile ? (
            <ChatWorkflow person={selectedProfile} />
          ) : null}
          {activeRoute === "notifications" ? (
            <NotificationsWorkflow followingCount={followingCount} />
          ) : null}
        </main>
      </div>
    </div>
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

function LoginWorkflow({ onNotice }: { onNotice: (message: string) => void }) {
  const [email, setEmail] = React.useState("mira@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Continue recent workspace activity with an existing account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onNotice(`Signed in as ${email}`);
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
    </Card>
  );
}

function RegisterWorkflow({ onNotice }: { onNotice: (message: string) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("new-user@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a platform profile for team collaboration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onNotice(`Workspace profile created for ${name || email}`);
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
    </Card>
  );
}

function PasswordWorkflow({ onNotice }: { onNotice: (message: string) => void }) {
  const [email, setEmail] = React.useState("mira@example.com");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Password forgotten</CardTitle>
        <CardDescription>Request a recovery email for a locked-out account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onNotice(`Reset link sent to ${email}`);
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
    </Card>
  );
}

function PeopleWorkflow({
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

function ProfileWorkflow({
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

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function ChatWorkflow({ person }: { person: Person }) {
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

function NotificationsWorkflow({ followingCount }: { followingCount: number }) {
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

function Field({ children, id, label }: { children: React.ReactNode; id: string; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
