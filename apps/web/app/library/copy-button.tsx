"use client";

import { useState } from "react";
import { useT } from "@/app/i18n-provider";
import { trackUse } from "@/lib/track";

/** Copies a text to the clipboard and says so for two seconds. */
export function CopyButton({ text, label, testId, track }: { text: string; label: string; testId?: string; track?: "copy_sentence" | "copy_apa" }) {
  const [done, setDone] = useState(false);
  const { t } = useT();
  return (
    <button
      type="button"
      className="copy-button"
      data-testid={testId}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          if (track) trackUse(track);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt(t("c.copyPrompt"), text);
        }
      }}
    >
      {done ? t("c.copied") : label}
    </button>
  );
}
