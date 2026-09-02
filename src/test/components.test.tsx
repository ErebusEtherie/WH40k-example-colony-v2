import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Footer } from "../components/Footer";
import { ThemeDropdown } from "../components/ThemeDropdown";
import { LoginScreen } from "../components/LoginScreen";
import * as api from "../lib/api";

describe("Frontend Component Suite", () => {
  describe("Footer Component", () => {
    it("renders Adeptus Mechanicus header and colony metrics", () => {
      render(
        <Footer
          colonyCount={4}
          activeColonyName="Port Wander Station"
        />
      );

      expect(screen.getByText(/ADEPTUS MECHANICUS COGITATION ENGINE/i)).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Port Wander Station")).toBeInTheDocument();
    });

    it("triggers onExportData when the export button is clicked", () => {
      const handleExport = vi.fn();
      render(
        <Footer
          colonyCount={2}
          activeColonyName="Footfall"
          onExportData={handleExport}
        />
      );

      const exportBtn = screen.getByText(/Export Cogitator Data/i);
      fireEvent.click(exportBtn);

      expect(handleExport).toHaveBeenCalledTimes(1);
    });

    it("triggers onImportData when a JSON file is uploaded", () => {
      const handleImport = vi.fn();
      render(
        <Footer
          colonyCount={1}
          activeColonyName="Dargonus"
          onImportData={handleImport}
        />
      );

      const input = screen.getByTestId ? screen.queryByTestId("import-input") : null;
      // Find hidden file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const testFile = new File([JSON.stringify({ test: "data" })], "test.json", {
        type: "application/json",
      });

      fireEvent.change(fileInput, { target: { files: [testFile] } });
      expect(handleImport).toHaveBeenCalledWith(testFile);
    });
  });

  describe("ThemeDropdown Component", () => {
    it("renders with the active theme and expands options when clicked", () => {
      const handleSelectTheme = vi.fn();
      render(
        <ThemeDropdown
          currentTheme="dataslate"
          onSelectTheme={handleSelectTheme}
        />
      );

      // Trigger button
      const trigger = screen.getByRole("button", { name: /Theme/i });
      expect(trigger).toBeInTheDocument();

      // Click to open dropdown
      fireEvent.click(trigger);

      // Verify theme options appear
      expect(screen.getByText("Mechanicum Data-Slate (Canonical)")).toBeInTheDocument();
      expect(screen.getByText("Omnissiah Shrine & Forge")).toBeInTheDocument();
      expect(screen.getByText("Inquisition Sanctum")).toBeInTheDocument();

      // Select Inquisition theme
      const inquisitionBtn = screen.getByText("Inquisition Sanctum");
      fireEvent.click(inquisitionBtn);

      expect(handleSelectTheme).toHaveBeenCalledWith("inquisition");
    });
  });

  describe("LoginScreen Component", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("renders login form with default credentials and clearance roles", () => {
      const handleLogin = vi.fn();
      render(<LoginScreen onLogin={handleLogin} />);

      expect(screen.getByText(/IMPERIAL DATA-SLATE • COLONY MANAGER/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("LordCaptain")).toBeInTheDocument();
      expect(screen.getByDisplayValue("WarrantOfTrade")).toBeInTheDocument();

      // Quick roles buttons
      expect(screen.getByText("Lord Captain")).toBeInTheDocument();
      expect(screen.getByText("Magos Biologis")).toBeInTheDocument();
      expect(screen.getByText("Seneschal")).toBeInTheDocument();
    });

    it("updates form inputs when quick-role credentials are clicked", () => {
      const handleLogin = vi.fn();
      render(<LoginScreen onLogin={handleLogin} />);

      const magosButton = screen.getByText("Magos Biologis");
      fireEvent.click(magosButton);

      expect(screen.getByDisplayValue("MagosBiologis")).toBeInTheDocument();
      expect(screen.getByDisplayValue("OmnissiahLogic")).toBeInTheDocument();
    });

    it("shows error if username is empty on submit", () => {
      const handleLogin = vi.fn();
      render(<LoginScreen onLogin={handleLogin} />);

      const usernameInput = screen.getByDisplayValue("LordCaptain");
      fireEvent.change(usernameInput, { target: { value: "   " } });

      const submitButton = screen.getByRole("button", { name: /Authenticate Credentials/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Please provide a valid Dynasty Cipher/i)).toBeInTheDocument();
      expect(handleLogin).not.toHaveBeenCalled();
    });

    it("calls onLogin when API authentication succeeds", async () => {
      const mockUser = {
        username: "LordCaptain",
        role: "rogue_trader",
        clearance_level: 4,
        display_title: "Rogue Trader",
        is_active: true,
      };

      vi.spyOn(api, "loginApi").mockResolvedValueOnce(mockUser);

      const handleLogin = vi.fn();
      render(<LoginScreen onLogin={handleLogin} />);

      const submitButton = screen.getByRole("button", { name: /Authenticate Credentials/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleLogin).toHaveBeenCalledWith(mockUser);
      });
    });

    it("displays error banner when API authentication fails", async () => {
      vi.spyOn(api, "loginApi").mockRejectedValueOnce(
        new Error("Invalid Imperial Cipher sequence")
      );

      const handleLogin = vi.fn();
      render(<LoginScreen onLogin={handleLogin} />);

      const submitButton = screen.getByRole("button", { name: /Authenticate Credentials/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid Imperial Cipher sequence")).toBeInTheDocument();
      });
      expect(handleLogin).not.toHaveBeenCalled();
    });
  });
});
