import type { MetadataRoute } from "next";
import { CRAWLER_DISALLOW, indexingAllowed } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Closed to crawlers until ALLOW_INDEXING=1 (lib/seo.ts); even when open, never the API, admin, sign-in or exports. */
export default function robots(): MetadataRoute.Robots {
  return indexingAllowed() ? { rules: { userAgent: "*", allow: "/", disallow: CRAWLER_DISALLOW } } : { rules: { userAgent: "*", disallow: "/" } };
}
