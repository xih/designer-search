import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";
import path from "path";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./.storybook/vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/tests/**/*.test.{ts,tsx}"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        ".storybook/",
        "**/*.stories.*",
      ],
      // Thresholds can be enabled when you have more comprehensive tests
      // thresholds: {
      //   global: {
      //     branches: 80,
      //     functions: 80,
      //     lines: 80,
      //     statements: 80
      //   }
      // }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
});
