import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/*/src/**/*.integration.test.ts"],
    environment: "node",
    // Tests share one database connection, so run them one at a time.
    fileParallelism: false,
  },
});
