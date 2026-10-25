"use client";

import { useState } from "react";
import { useT } from "@/app/i18n-provider";

/** Copies the address of this result with the release of the data it was computed on, so the link says which numbers it stands for. */
export function PermalinkButton({ path, testId }: { path: string; testId?: string }) {
  const [done, setDone] = useState(false);
  const { t } = useT();
  return (
    <button
      type="button"
      className="copy-button"
      data-testid={testId}
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt(t("c.permalinkPrompt"), url);
        }
      }}
    >
      {done ? t("c.copied") : t("c.permalink")}
    </button>
  );
}
