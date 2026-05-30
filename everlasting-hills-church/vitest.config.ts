import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vitest config.
 *
 * - happy-dom over jsdom: ~2× faster boot, sufficient for RTL.
 * - `@/` alias mirrors next.config.js / tsconfig so test imports match runtime.
 * - Globals enabled so tests don't need to import { describe, it, expect } every file.
 * - Server Components (async functions returning JSX) cannot be tested directly here —
 *   they need Playwright. Test their pure-function helpers separately.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/lib/api/generated/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "components/**", "app/**"],
      exclude: ["**/*.{test,spec}.{ts,tsx}", "lib/api/generated/**"],
    },
  },
});
