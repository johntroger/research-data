"use client";

import { useEffect, useState } from "react";
import { type BackTarget, backTarget } from "@/lib/back-link";
import { rememberedList } from "@/app/nav-memory";

/** "← Quay lại kết quả" when the reader came from a search result, the library or the matrix; nothing for a shared link or a typed address. */
export function BackToResults() {
  const [target, setTarget] = useState<BackTarget | null>(null);
  // The referrer exists only in the browser, so it is read after the first render: the server and the browser draw the same page first.
  // The list the reader was last on inside this site first (moving between pages does not reload, so the referrer would still name the first page);
  // after a full load of this page, the referrer.
  useEffect(() => {
    const origin = window.location.origin;
    const remembered = rememberedList();
    setTarget((remembered ? backTarget(`${origin}${remembered}`, origin) : null) ?? backTarget(document.referrer, origin));
  }, []);
  if (!target) return null;
  return (
    <p className="back-link" data-testid="back-to-results">
      <a
        href={target.href}
        onClick={(e) => {
          // Going back keeps the scroll position and what was open; a paper opened in its own tab has no history to go back to, so the link is followed.
          if (window.history.length > 1) {
            e.preventDefault();
            window.history.back();
          }
        }}
      >
        ← {target.label}
      </a>
    </p>
  );
}
