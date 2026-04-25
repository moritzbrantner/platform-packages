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
