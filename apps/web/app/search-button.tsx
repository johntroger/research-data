"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * The submit button of a search or filter form: after it is pressed it says "Đang tìm…" and cannot be pressed again while the next page is
 * on its way. The form still submits as a plain GET, so it works the same without JavaScript (then the button is just a button).
 */
export function SearchButton({ children, pendingLabel = "Đang tìm…" }: { children: ReactNode; pendingLabel?: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const form = button.current?.form;
    if (!form) return;
    const start = () => setPending(true);
    // Coming back to this page from the browser's cache shows the old page with the button as it was left: put it back.
    const reset = () => setPending(false);
    form.addEventListener("submit", start);
    window.addEventListener("pageshow", reset);
    return () => {
      form.removeEventListener("submit", start);
      window.removeEventListener("pageshow", reset);
    };
  }, []);
  return (
    <>
      <button ref={button} type="submit" disabled={pending} aria-busy={pending}>
        {pending ? pendingLabel : children}
      </button>
      <span role="status" className="sr-only">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}
