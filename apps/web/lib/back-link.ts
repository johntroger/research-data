/**
 * "← Quay lại kết quả" on a paper page (P-next): where the reader came from, if it was a list on this site. Pure, so it is tested without a
 * browser. Only the three list pages count, only from the same origin, and the link is rebuilt from the path and query alone: a referrer
 * is never followed as given, so it cannot send anyone to another site.
 */
export interface BackTarget {
  href: string;
  label: string;
}

export function backTarget(referrer: string | null | undefined, origin: string): BackTarget | null {
  if (!referrer) return null;
  let from: URL;
  let here: URL;
  try {
    from = new URL(referrer);
    here = new URL(origin);
  } catch {
    return null;
  }
  if (from.origin !== here.origin) return null;
  const href = `${from.pathname}${from.search}`;
  if (from.pathname === "/") return from.searchParams.has("a") || from.searchParams.has("b") ? { href, label: "Quay lại kết quả tìm quan hệ" } : null;
  if (from.pathname === "/library") return { href, label: "Quay lại Thư viện" };
  if (from.pathname === "/matrix") return { href, label: "Quay lại Ma trận" };
  return null;
}
