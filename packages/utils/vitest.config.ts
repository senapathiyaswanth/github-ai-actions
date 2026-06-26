import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov", "html"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.d.ts", "tests/**", "src/index.ts", "src/types.ts", "vitest.config.ts"],
    },
  },
});
