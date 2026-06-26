import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov", "html"],
      thresholds: {
        lines: 80,
        functions: 50,
        branches: 50,
        statements: 80,
      },
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.d.ts", "tests/**", "src/index.ts", "src/types.ts", "vitest.config.ts"],
    },
  },
});
