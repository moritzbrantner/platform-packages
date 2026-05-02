import { describe, expect, test } from "vitest";

import { createAuthState, isSessionActive, type AuthSession } from "@moritzbrantner/auth-contract";

const activeSession: AuthSession = {
  user: {
    id: "user-1",
    email: "alex@example.com",
    displayName: "Alex",
    roles: ["USER"],
    permissions: ["profile.editOwn"],
  },
  expiresAt: "2027-04-21T12:00:00.000Z",
  isAuthenticated: true,
};

describe("@moritzbrantner/auth-contract", () => {
  test("detects active and expired sessions", () => {
    expect(isSessionActive(activeSession, new Date("2027-04-21T11:00:00.000Z"))).toBe(true);
    expect(isSessionActive(activeSession, new Date("2027-04-21T13:00:00.000Z"))).toBe(false);
    expect(isSessionActive(null)).toBe(false);
  });

  test("creates normalized auth state from a session", () => {
    expect(createAuthState(activeSession).status).toBe("authenticated");
    expect(createAuthState(null)).toEqual({
      status: "unauthenticated",
      session: null,
      error: null,
    });
  });
});
