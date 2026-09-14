import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Keep Playwright E2E specs (e2e/**) out of the vitest unit-test run; they
    // run via the Playwright runner instead. Without this, vitest's default
    // include glob tries to load e2e/dashboard.spec.ts and fails to resolve
    // @playwright/test.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
