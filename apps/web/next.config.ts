import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // Monorepo: trace files from the repository root.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@research-data/schema"],
};

export default config;
