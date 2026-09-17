import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import type { User } from "../types/colony";

// DEV_MODE is captured in LoginScreen at module evaluation time from
// import.meta.env.VITE_DEV_MODE === "true", so the env must be stubbed BEFORE the
// module is imported. Vitest runs each test file in an isolated module registry,
// so this file can build a dev-mode copy of the component while
// LoginScreen.test.tsx builds the non-dev one; the login round-trip rides the
// shared MSW auth handlers (contract-drift guard, per 08-frontend-testing.md).
vi.stubEnv("VITE_DEV_MODE", "true");

let LoginScreen: ComponentType<{ onLogin: (user: User) => void }>;

beforeAll(async () => {
  ({ LoginScreen } = await import("../components/LoginScreen"));
});

afterEach(() => {
  // Restore the env so the stub can't leak into another file sharing this
  // worker (the already-evaluated LoginScreen module keeps DEV_MODE=true).
  vi.unstubAllEnvs();
});

describe("LoginScreen with VITE_DEV_MODE=true (dev bypass panel)", () => {
  it("renders the three preset clearance identity bypass buttons", () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Arch Magos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Lord Captain/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Servitor/i })
    ).toBeInTheDocument();
  });

  it("prefills the form with the Lord Captain demo credentials", () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(
      (screen.getByLabelText(/Rogue Trader ID/i) as HTMLInputElement).value
    ).toBe("LordCaptain");
    expect(
      (screen.getByLabelText(/Authentication Key/i) as HTMLInputElement).value
    ).toBe("TestP@ss123");
  });

  it("logs in as Lord Captain when its bypass button is clicked", async () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.click(screen.getByRole("button", { name: /Lord Captain/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: "LordCaptain", role: "colony_manager" })
    );
  });
});
