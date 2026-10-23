import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // The production e2e run (playwright.prod.config.ts) builds into its own folder, so it never disturbs a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Monorepo: trace files from the repository root.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@research-data/schema"],
  async headers() {
    const headers = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    ];
    // Not announced to search engines until ALLOW_INDEXING=1 (lib/seo.ts), also for files that carry no <meta> (the PDF links, exports).
    if (process.env.ALLOW_INDEXING?.trim() !== "1") headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
    return [{ source: "/:path*", headers }];
  },
};

export default config;
