"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { backTarget } from "@/lib/back-link";

/**
 * The last list page (search result, library, matrix) the reader was on, kept in the memory of the page. Moving between pages of this site
 * does not reload it, so the browser's referrer still names the page it was first opened from; this does not. A full reload (a shared link,
 * a typed address) starts with nothing, which is what "no list to go back to" should mean.
 */
let lastList: string | null = null;

export const rememberedList = (): string | null => lastList;

export function NavTracker() {
  const path = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    const url = `${path}${search ? `?${search}` : ""}`;
    if (backTarget(`${window.location.origin}${url}`, window.location.origin)) lastList = url;
  }, [path, search]);
  return null;
}
