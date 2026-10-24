/** Browser side of the usage counters (step 4.6): tell the site a visitor opened evidence or copied something. Fire and forget; nothing is sent about the visitor. */
import type { CLIENT_EVENTS } from "./usage";

export function trackUse(event: (typeof CLIENT_EVENTS)[number]): void {
  try {
    navigator.sendBeacon("/api/event", new Blob([JSON.stringify({ event })], { type: "application/json" }));
  } catch {
    // Not counting is better than a broken button.
  }
}
