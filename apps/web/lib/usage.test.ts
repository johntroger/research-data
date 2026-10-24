import { describe, expect, it } from "vitest";
import { CLIENT_EVENTS, EVENT_LABELS, isClientEvent, recordUse, SERVER_EVENTS } from "./usage";

describe("the closed list of kinds of use", () => {
  it("has a label for every kind, and no kind is both server and client", () => {
    for (const e of [...SERVER_EVENTS, ...CLIENT_EVENTS]) expect(EVENT_LABELS[e], e).toBeTruthy();
    expect(SERVER_EVENTS.filter((e) => (CLIENT_EVENTS as readonly string[]).includes(e))).toEqual([]);
  });
  it("lets the browser report only its own kinds", () => {
    expect(isClientEvent("evidence_open")).toBe(true);
    expect(isClientEvent("copy_apa")).toBe(true);
    expect(isClientEvent("export_excel")).toBe(false); // counted by the server, never by what a browser says
    expect(isClientEvent("pdf_download")).toBe(false);
    expect(isClientEvent("whatever")).toBe(false);
    expect(isClientEvent(undefined)).toBe(false);
    expect(isClientEvent({})).toBe(false);
  });
});

describe("recordUse", () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key" };
  it("calls the public counting function with the kind and nothing about the visitor", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    await recordUse("relation_search", env, (async (url: string, init: RequestInit) => ((seen = { url, init }), new Response(null, { status: 204 }))) as unknown as typeof fetch);
    expect(seen!.url).toBe("https://x.supabase.co/rest/v1/rpc/count_event");
    expect(JSON.parse(String(seen!.init.body))).toEqual({ p_event: "relation_search" });
    expect(Object.keys(seen!.init.headers as object).map((h) => h.toLowerCase()).sort()).toEqual(["apikey", "authorization", "content-type"]);
  });
  it("never throws, and does nothing without the address", async () => {
    await expect(recordUse("copy_apa", env, (async () => { throw new Error("network down"); }) as unknown as typeof fetch)).resolves.toBeUndefined();
    let called = false;
    await recordUse("copy_apa", {}, (async () => ((called = true), new Response())) as unknown as typeof fetch);
    expect(called).toBe(false);
  });
});
