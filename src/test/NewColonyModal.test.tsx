import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "./msw/server";
import { NewColonyModal } from "../components/modals/NewColonyModal";

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const onCreateColony = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <NewColonyModal isOpen onClose={vi.fn()} onCreateColony={onCreateColony} />
    </QueryClientProvider>
  );
  return { onCreateColony };
}

describe("NewColonyModal colony-type preview", () => {
  it("shows a loading state while colony types are being fetched", () => {
    server.use(
      http.get("*/api/v1/config/colony-types", () => new Promise(() => {}))
    );
    renderModal();
    expect(screen.getByTestId("colony-types-loading")).toBeInTheDocument();
  });

  it("shows an error state when colony types fail to load", async () => {
    server.use(
      http.get("*/api/v1/config/colony-types", () =>
        HttpResponse.json(
          { detail: "Colony directory offline" },
          { status: 500 }
        )
      )
    );
    renderModal();
    const errorBox = await screen.findByTestId("colony-types-error");
    expect(errorBox).toHaveTextContent("Colony directory offline");
  });

  it("renders the selected type's 4 starting stats, starting benefit, and conditional bonus", async () => {
    renderModal();

    // Default selection is mining_and_industry.
    expect(await screen.findByText("Mining and Industry")).toBeInTheDocument();

    // Starting base stats (Size intentionally not rendered).
    expect(screen.getByTestId("stat-productivity")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-piety")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-order")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-complacency")).toHaveTextContent("1");

    // Starting benefit ("free … Upgrade") — must not contain the conditional
    // exploit text, which belongs only in the Conditional Bonuses section.
    const starting = within(screen.getByTestId("starting-benefits"));
    expect(
      starting.getByText(/Begins with a free Industrial Facility Upgrade/i)
    ).toBeInTheDocument();
    expect(
      starting.queryByText(/when exploiting Mineral Resources/i)
    ).not.toBeInTheDocument();

    // Conditional bonus — the sections are already split into Starting /
    // Conditional headings, so no per-item "Conditional" badge is rendered.
    const conditional = within(screen.getByTestId("conditional-bonuses"));
    expect(
      conditional.getByText(/when exploiting Mineral Resources/i)
    ).toBeInTheDocument();
    expect(conditional.queryByTestId("conditional-badge")).not.toBeInTheDocument();
  });

  it("updates the preview panel when a different colony type is selected", async () => {
    renderModal();

    const researchButton = await screen.findByRole("button", {
      name: /Research Mission/i,
    });
    fireEvent.click(researchButton);

    await waitFor(() =>
      expect(screen.getByTestId("stat-productivity")).toHaveTextContent("1")
    );
    expect(screen.getByTestId("stat-complacency")).toHaveTextContent("2");

    // Research Mission grants no free starting upgrade, so the Starting
    // Benefits section is absent — but it does have a conditional bonus.
    expect(screen.queryByTestId("starting-benefits")).not.toBeInTheDocument();
    expect(screen.getByTestId("conditional-bonuses")).toBeInTheDocument();
  });
});

describe("NewColonyModal founding size", () => {
  it("defaults founding size to 1 and passes the selected size to onCreateColony", async () => {
    const { onCreateColony } = renderModal();

    // Wait for colony types to load so the submit handler is fully wired.
    await screen.findByText("Mining and Industry");

    const sizeInput = screen.getByLabelText(
      /Initial Settlement Size/i
    ) as HTMLInputElement;
    expect(sizeInput).toHaveValue(1);

    // Pick an advanced-stage founding size.
    fireEvent.change(sizeInput, { target: { value: "4" } });
    expect(sizeInput).toHaveValue(4);

    fireEvent.change(screen.getByLabelText(/Colony Name/i), {
      target: { value: "Castellax Secundus" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Establish New Colony/i })
    );

    expect(onCreateColony).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Castellax Secundus", base_size: 4 })
    );
  });
});
