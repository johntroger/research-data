/**
 * Counting how the site is used (step 4.6): one more on today's counter of a kind of use, nothing else. No IP, no cookie, no path, no
 * user: the database table holds (day, kind, count). The owner's own use is not counted. Counting never slows or breaks a page: it runs
 * after the response is sent, and any failure is swallowed.
 */
import { after } from "next/server";
import { getOwner } from "./supabase-server";

export const SERVER_EVENTS = ["relation_search", "export_excel", "export_word", "export_word_matrix", "export_csv", "export_ris", "export_bibtex", "pdf_view", "pdf_download"] as const;
/** What the browser may report about itself; anything else sent to /api/event is refused. */
export const CLIENT_EVENTS = ["evidence_open", "copy_sentence", "copy_apa"] as const;
export type UsageEvent = (typeof SERVER_EVENTS)[number] | (typeof CLIENT_EVENTS)[number];

export const isClientEvent = (value: unknown): value is (typeof CLIENT_EVENTS)[number] => typeof value === "string" && (CLIENT_EVENTS as readonly string[]).includes(value);

export const EVENT_LABELS: Record<UsageEvent, string> = {
  relation_search: "Tìm quan hệ",
  evidence_open: "Mở bằng chứng",
  export_excel: "Xuất Excel",
  export_word: "Xuất Word (quan hệ)",
  export_word_matrix: "Xuất Word (ma trận)",
  export_csv: "Xuất CSV",
  export_ris: "Xuất RIS",
  export_bibtex: "Xuất BibTeX",
  pdf_view: "Xem PDF",
  pdf_download: "Tải PDF",
  copy_sentence: "Copy câu",
  copy_apa: "Copy APA",
};

/** Adds one to today's counter through the public database function (the visitor's rights; the function only accepts the closed list). */
export async function recordUse(event: UsageEvent, env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): Promise<void> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    await fetchImpl(`${url}/rest/v1/rpc/count_event`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_event: event }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Not counting is better than a broken page.
  }
}

/** Counts a use of the site by a visitor, after the response; the owner's own use is skipped. Call from a page or a route handler. */
export async function countUse(event: UsageEvent): Promise<void> {
  if (await getOwner()) return;
  after(() => recordUse(event));
}
