import { describe, it, expect, beforeEach } from "vitest";
import { authStorage, AuthSession } from "../lib/api";
import { User } from "../types/colony";

describe("Frontend Auth Storage & Session Manager", () => {
  const mockUser: User = {
    username: "inquisitor_roth",
    role: "inquisitor",
    clearance_level: 4,
    display_title: "Inquisitor Lord",
    is_active: true,
  };

  const mockSession: AuthSession = {
    accessToken: "jwt-test-access-token-omnissiah",
    refreshToken: "jwt-test-refresh-token-omnissiah",
    user: mockUser,
  };

  beforeEach(() => {
    authStorage.clearSession();
  });

  it("returns null when session is not set", () => {
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it("saves and retrieves full authentication session correctly", () => {
    authStorage.saveSession(mockSession);

    expect(authStorage.getAccessToken()).toBe("jwt-test-access-token-omnissiah");
    expect(authStorage.getRefreshToken()).toBe("jwt-test-refresh-token-omnissiah");

    const retrievedUser = authStorage.getUser();
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.username).toBe("inquisitor_roth");
    expect(retrievedUser?.role).toBe("inquisitor");
    expect(retrievedUser?.clearance_level).toBe(4);
  });

  it("updates access token independently during token refresh", () => {
    authStorage.saveSession(mockSession);

    authStorage.updateAccessToken("jwt-new-refreshed-token");

    expect(authStorage.getAccessToken()).toBe("jwt-new-refreshed-token");
    // Refresh token and user profile should remain intact
    expect(authStorage.getRefreshToken()).toBe("jwt-test-refresh-token-omnissiah");
    expect(authStorage.getUser()?.username).toBe("inquisitor_roth");
  });

  it("clears session completely on logout", () => {
    authStorage.saveSession(mockSession);
    expect(authStorage.getAccessToken()).toBeTruthy();

    authStorage.clearSession();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it("gracefully recovers and returns null if stored user JSON is corrupted", () => {
    localStorage.setItem("rt_auth_user", "INVALID_NOT_JSON{{{{");

    const user = authStorage.getUser();
    expect(user).toBeNull();
  });
});
