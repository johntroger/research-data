import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // The production e2e run (playwright.prod.config.ts) builds into its own folder, so it never disturbs a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Monorepo: trace files from the repository root.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@research-data/schema"],
};

export default config;
