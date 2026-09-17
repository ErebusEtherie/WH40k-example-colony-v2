import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "./msw/server";
import { LoginScreen } from "../components/LoginScreen";

/**
 * LoginScreen tests for the production (non-dev) build — i.e. when
 * VITE_DEV_MODE is not set to "true". The dev bypass panel must be absent so no
 * one can sign in with credentials shipped in the client source, and the normal
 * username/password flow must drive onLogin with the authenticated user (per
 * 08-frontend-testing.md: the right API call fires with the right payload, and
 * a failed mutation surfaces an error state instead of failing silently).
 *
 * The dev-mode build (VITE_DEV_MODE=true) is covered separately in
 * LoginScreen.dev.test.tsx, since DEV_MODE is captured at module evaluation.
 */

describe("LoginScreen without VITE_DEV_MODE", () => {
  it("renders the login form but no preset clearance identity buttons", () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Arch Magos/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Lord Captain/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Servitor/i })
    ).not.toBeInTheDocument();

    // No prefilled demo credentials.
    expect(
      (screen.getByLabelText(/Rogue Trader ID/i) as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByLabelText(/Authentication Key/i) as HTMLInputElement).value
    ).toBe("");
  });

  it("rejects a blank username with an inline error and never calls onLogin", () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    );

    expect(
      screen.getByText(/Please provide a valid Rogue Trader ID/i)
    ).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("sends the entered credentials to the backend and reports the authenticated user", async () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/Rogue Trader ID/i), {
      target: { value: "LordCaptain" },
    });
    fireEvent.change(screen.getByLabelText(/Authentication Key/i), {
      target: { value: "TestP@ss123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    );

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: "LordCaptain" })
    );
  });

  it("posts the exact username/password to POST /auth/login", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("*/api/v1/auth/login", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ message: "Login successful" });
      })
    );

    render(<LoginScreen onLogin={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Rogue Trader ID/i), {
      target: { value: "LordCaptain" },
    });
    fireEvent.change(screen.getByLabelText(/Authentication Key/i), {
      target: { value: "TestP@ss123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    );

    await waitFor(() =>
      expect(receivedBody).toEqual({
        username: "LordCaptain",
        password: "TestP@ss123",
      })
    );
  });

  it("surfaces the backend error message when authentication fails and never calls onLogin", async () => {
    // A non-401 status keeps this test out of the shared 401-refresh machinery
    // (that flow belongs to the Playwright E2E suite per 08-frontend-testing.md);
    // a 500 still exercises "failed mutation surfaces an error state".
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ detail: "Cogitator link severed" }, { status: 500 })
      )
    );

    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/Rogue Trader ID/i), {
      target: { value: "LordCaptain" },
    });
    fireEvent.change(screen.getByLabelText(/Authentication Key/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    );

    expect(
      await screen.findByText("Cogitator link severed")
    ).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("shows the credential error, not a session-expired message, on a login 401", async () => {
    // With login 401s treated as credential rejections in the shared layer
    // (skipAuthRefresh), a wrong password surfaces the backend's real message
    // and never enters the refresh-retry machinery — so this mapping is safely
    // testable here via MSW rather than only in the real-browser E2E suite.
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

    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/Rogue Trader ID/i), {
      target: { value: "LordCaptain" },
    });
    fireEvent.change(screen.getByLabelText(/Authentication Key/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Access Colonial Registry/i })
    );

    expect(
      await screen.findByText("Invalid username or password")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Session expired/i)).not.toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
    expect(refreshCalls).toBe(0);
  });
});
