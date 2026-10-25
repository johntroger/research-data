"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LANGS, type Lang } from "@/lib/i18n";

function Links({ lang }: { lang: Lang }) {
  const path = usePathname();
  const params = useSearchParams();
  const hrefFor = (target: Lang) => {
    const next = new URLSearchParams(params.toString());
    next.set("lang", target);
    return `${path}?${next.toString()}`;
  };
  return (
    <span className="lang-switch" data-testid="lang-switch">
      {LANGS.map((l, i) => (
        <span key={l}>
          {i > 0 ? " | " : ""}
          {l === lang ? (
            <strong aria-current="true">{l.toUpperCase()}</strong>
          ) : (
            <a href={hrefFor(l)} hrefLang={l} data-testid={`lang-${l}`}>
              {l.toUpperCase()}
            </a>
          )}
        </span>
      ))}
    </span>
  );
}

/** VI | EN: links to the same page with ?lang=…; the proxy stores the choice and removes the parameter again. */
export function LangSwitch({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={null}>
      <Links lang={lang} />
    </Suspense>
  );
}
