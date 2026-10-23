import { defineConfig, devices } from "@playwright/test";

/**
 * Tests of the site as it runs when deployed (step A.4): a production build with no developer-machine shortcut, so the owner is only
 * ever someone signed in. Builds into .next-prod and serves on port 3001 against the local Supabase. Run: pnpm test:e2e:prod
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/prod-*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3001", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm exec next build && pnpm exec next start --port 3001",
    url: "http://localhost:3001/login",
    reuseExistingServer: false,
    timeout: 300_000,
    // TRUST_PROXY: the tests play different visitors by sending their own forwarded-for address (A.5).
    env: { NEXT_DIST_DIR: ".next-prod", TRUST_PROXY: "1" },
  },
});
