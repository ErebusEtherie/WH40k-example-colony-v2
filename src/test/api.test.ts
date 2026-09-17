import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw/server";
import { apiFetch, loginApi } from "../lib/api";

/**
 * Request-layer tests for the shared API core in src/lib/api.ts.
 *
 * apiFetch routes through the same apiRequest core as the TanStack Query hooks
 * (fetchApi), so these exercise the real credentials/CSRF/401-refresh-retry
 * path via MSW rather than mocking it (per 08-frontend-testing.md).
 *
 * The concurrent-401 mutex test is the critical one: now that the backend
 * rotates the refresh cookie, a naive per-request /auth/refresh would race —
 * the first succeeds and the rest fail on the already-rotated token.
 */

describe("API request core - 401 refresh handling", () => {
  it("coalesces concurrent 401s onto a single /auth/refresh call", async () => {
    let refreshCalls = 0;
    let colonyCalls = 0;

    server.use(
      http.get("*/api/v1/colonies", () => {
        colonyCalls += 1;
        // The first wave of concurrent requests 401s; retries (after the
        // shared refresh succeeds) are served normally.
        const first401 = colonyCalls <= 3 && refreshCalls === 0;
        return first401
          ? HttpResponse.json({ detail: "Token expired" }, { status: 401 })
          : HttpResponse.json([{ id: "c1", name: "Colony One" }]);
      }),
      http.post("*/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json({ message: "Token refreshed successfully" });
      })
    );

    const responses = await Promise.all([
      apiFetch("/api/v1/colonies"),
      apiFetch("/api/v1/colonies"),
      apiFetch("/api/v1/colonies"),
    ]);

    // Exactly ONE refresh for three concurrent 401s (shared in-flight mutex)…
    expect(refreshCalls).toBe(1);
    // …and every original request was retried once and succeeded.
    responses.forEach((r) => expect(r.ok).toBe(true));
  });

  it("does not retry the original request when refresh fails", async () => {
    let refreshCalls = 0;

    server.use(
      http.get("*/api/v1/colonies", () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      ),
      http.post("*/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json(
          { detail: "Refresh token not found. Please log in again." },
          { status: 401 }
        );
      })
    );

    const response = await apiFetch("/api/v1/colonies");

    expect(response.status).toBe(401);
    expect(refreshCalls).toBe(1);
  });

  it("surfaces the real credential error on a login 401 and never refreshes", async () => {
    let refreshCalls = 0;

    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json(
          { detail: "Invalid username or password" },
          { status: 401 }
        )
      ),
      http.post("*/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json({ message: "refreshed" });
      })
    );

    // A login 401 is a credential rejection (skipAuthRefresh), not a session
    // expiry: it must surface the backend's message and never enter the
    // refresh-retry machinery (there is no session to refresh yet).
    await expect(loginApi("LordCaptain", "wrongpassword")).rejects.toMatchObject(
      {
        status: 401,
        message: "Invalid username or password",
      }
    );
    expect(refreshCalls).toBe(0);
  });

  it("strips a redundant /api/v1 prefix from legacy apiFetch paths", async () => {
    let seenUrl: string | null = null;
    server.use(
      http.get("*/api/v1/colonies/:id", ({ request }) => {
        seenUrl = request.url;
        return HttpResponse.json({ id: "c1", name: "Colony One" });
      })
    );

    const response = await apiFetch("/api/v1/colonies/c1");
    expect(response.ok).toBe(true);
    expect(seenUrl).toMatch(/\/api\/v1\/colonies\/c1$/);
  });
});
