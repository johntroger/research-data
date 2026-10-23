"use client";

import { useState } from "react";

/** Copies a text to the clipboard and says so for two seconds. */
export function CopyButton({ text, label, testId }: { text: string; label: string; testId?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy-button"
      data-testid={testId}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("Sao chép:", text);
        }
      }}
    >
      {done ? "Đã chép ✓" : label}
    </button>
  );
}
