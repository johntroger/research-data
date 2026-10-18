import { describe, expect, it } from "vitest";
import { readOnlyKeyProblems, ZoteroClient, ZoteroError, type ZoteroKeyInfo } from "./client.js";
import { collectionTree, findCollection, INBOX_PATH, inboxPath, listInbox } from "./inbox.js";

interface Call {
  url: string;
  headers: Record<string, string>;
  redirect: string | undefined;
}

/** Fake Zotero API: routes by path; each route returns a Response (or a list for successive calls). */
function fakeZotero(routes: Record<string, Response | Response[]>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string>, redirect: init?.redirect });
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response("not found", { status: 404 });
    const route = routes[key]!;
    return Array.isArray(route) ? route.shift()! : route.clone();
  }) as typeof fetch;
  const sleeps: number[] = [];
  const client = new ZoteroClient(
    { apiKey: "test-key", userId: "42" },
    { fetchImpl, sleep: async (ms) => void sleeps.push(ms) },
  );
  return { client, calls, sleeps };
}

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json", ...headers } });

const collections = [
  { key: "ROOT1", data: { key: "ROOT1", name: "Research Data", parentCollection: false } },
  { key: "INBX1", data: { key: "INBX1", name: "Inbox", parentCollection: "ROOT1" } },
  { key: "OTHR1", data: { key: "OTHR1", name: "Inbox", parentCollection: false } },
];

describe("ZoteroClient", () => {
  it("sends the API key and version only to api.zotero.org", async () => {
    const { client, calls } = fakeZotero({ "/keys/current": json({ userID: 42, access: {} }) });
    await client.keyInfo();
    expect(calls[0]!.url).toBe("https://api.zotero.org/keys/current");
    expect(calls[0]!.headers).toMatchObject({ "Zotero-API-Key": "test-key", "Zotero-API-Version": "3" });
  });

  it("follows pagination through the Link header", async () => {
    const page2 = "https://api.zotero.org/users/42/collections?limit=100&start=100";
    const { client } = fakeZotero({
      "start=100": json([collections[2]]),
      "/users/42/collections": json(collections.slice(0, 2), { Link: `<${page2}>; rel="next"` }),
    });
    const all = await client.getAll<{ key: string }>("/users/42/collections");
    expect(all.map((c) => c.key)).toEqual(["ROOT1", "INBX1", "OTHR1"]);
  });

  it("retries after 429 using Retry-After, then succeeds", async () => {
    const { client, sleeps } = fakeZotero({
      "/keys/current": [
        new Response("slow down", { status: 429, headers: { "Retry-After": "3" } }),
        json({ userID: 42, access: {} }),
      ],
    });
    await client.keyInfo();
    expect(sleeps).toEqual([3000]);
  });

  it("waits for a Backoff header before the next request", async () => {
    const { client, sleeps } = fakeZotero({
      "/keys/current": [json({ userID: 42, access: {} }, { Backoff: "5" }), json({ userID: 42, access: {} })],
    });
    await client.keyInfo();
    await client.keyInfo();
    expect(sleeps).toHaveLength(1);
    expect(sleeps[0]).toBeGreaterThan(4000);
  });

  it("throws a ZoteroError for other failures", async () => {
    const { client } = fakeZotero({ "/keys/current": new Response("forbidden", { status: 403 }) });
    await expect(client.keyInfo()).rejects.toBeInstanceOf(ZoteroError);
  });

  it("downloads a file by following the storage redirect WITHOUT the API key", async () => {
    const s3 = "https://zotero-storage.s3.amazonaws.com/abc?signature=xyz";
    const { client, calls } = fakeZotero({
      "/items/ATT1/file": new Response(null, { status: 302, headers: { Location: s3 } }),
      "s3.amazonaws.com": new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 }),
    });
    const bytes = await client.downloadFile("ATT1");
    expect(Buffer.from(bytes).toString()).toBe("%PDF");
    expect(calls[0]!.redirect).toBe("manual");
    expect(calls[1]!.url).toBe(s3);
    expect(calls[1]!.headers["Zotero-API-Key"]).toBeUndefined();
  });
});

describe("network failures", () => {
  it("retries a download whose storage connection drops half-way", async () => {
    let storageCalls = 0;
    const calls: string[] = [];
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("/items/ATT1/file")) {
        return new Response(null, { status: 302, headers: { Location: "https://s3.example/file" } });
      }
      storageCalls++;
      if (storageCalls === 1) {
        // A body stream that fails mid-way, like "SocketError: other side closed".
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([37, 80]));
            controller.error(new TypeError("fetch failed: other side closed"));
          },
        });
        return new Response(body, { status: 200 });
      }
      return new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 });
    }) as typeof fetch;
    const sleeps: number[] = [];
    const client = new ZoteroClient({ apiKey: "k", userId: "42" }, { fetchImpl, sleep: async (ms) => void sleeps.push(ms) });

    const bytes = await client.downloadFile("ATT1");
    expect(Buffer.from(bytes).toString()).toBe("%PDF");
    expect(storageCalls).toBe(2);
    expect(calls.filter((u) => u.includes("/items/ATT1/file"))).toHaveLength(2); // fresh signed URL
    expect(sleeps).toEqual([1000]);
  });

  it("retries an API request after a network error", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      if (n++ === 0) throw new TypeError("fetch failed");
      return json({ userID: 42, access: {} });
    }) as typeof fetch;
    const client = new ZoteroClient({ apiKey: "k", userId: "42" }, { fetchImpl, sleep: async () => {} });
    expect((await client.keyInfo()).userID).toBe(42);
  });

  it("gives up after maxRetries and does not retry client errors (404)", async () => {
    const fetchImpl = (async () => new Response("missing", { status: 404 })) as typeof fetch;
    const client = new ZoteroClient({ apiKey: "k", userId: "42" }, { fetchImpl, sleep: async () => {} });
    await expect(client.downloadFile("NOPE")).rejects.toMatchObject({ status: 404 });
  });
});

describe("readOnlyKeyProblems", () => {
  const base: ZoteroKeyInfo = { userID: 42, access: { user: { library: true, files: true, write: false } } };

  it("accepts a read-only key for the right user", () => {
    expect(readOnlyKeyProblems(base, "42")).toEqual([]);
  });

  it("rejects write access, missing library access and a different user", () => {
    expect(readOnlyKeyProblems({ ...base, access: { user: { library: true, write: true } } }, "42")).toEqual([
      expect.stringContaining("WRITE access"),
    ]);
    expect(readOnlyKeyProblems({ ...base, access: { user: { library: false } } }, "42")[0]).toContain("cannot read");
    expect(readOnlyKeyProblems(base, "7")[0]).toContain("not ZOTERO_USER_ID=7");
    expect(
      readOnlyKeyProblems({ ...base, access: { ...base.access, groups: { all: { library: true, write: true } } } }, "42"),
    ).toEqual([expect.stringContaining("group all")]);
  });
});

describe("inbox path and collection tree", () => {
  it("parses ZOTERO_INBOX_PATH with / or › and falls back to Research Data › Inbox", () => {
    expect(inboxPath("Dissertation / 1 - Social Media Marketing Ethics")).toEqual([
      "Dissertation",
      "1 - Social Media Marketing Ethics",
    ]);
    expect(inboxPath("A › B › C")).toEqual(["A", "B", "C"]);
    expect(inboxPath(undefined)).toEqual(["Research Data", "Inbox"]);
    expect(inboxPath("  ")).toEqual(["Research Data", "Inbox"]);
  });

  it("finds a nested existing collection by path", async () => {
    const nested = [
      { key: "D1", data: { key: "D1", name: "Dissertation", parentCollection: false } },
      { key: "S1", data: { key: "S1", name: "1 - Social Media Marketing Ethics", parentCollection: "D1" } },
      { key: "P1", data: { key: "P1", name: "privacy & data ethics", parentCollection: "S1" } },
    ];
    const { client } = fakeZotero({ "/users/42/collections": json(nested) });
    expect(await findCollection(client, inboxPath("Dissertation / 1 - Social Media Marketing Ethics"))).toBe("S1");
    expect(await collectionTree(client)).toEqual([
      { key: "D1", name: "Dissertation", depth: 0 },
      { key: "S1", name: "1 - Social Media Marketing Ethics", depth: 1 },
      { key: "P1", name: "privacy & data ethics", depth: 2 },
    ]);
  });
});

describe("inbox", () => {
  it("finds Research Data › Inbox by path, not any collection called Inbox", async () => {
    const { client } = fakeZotero({ "/users/42/collections": json(collections) });
    expect(await findCollection(client, INBOX_PATH)).toBe("INBX1");
    expect(await findCollection(client, ["Research Data", "Missing"])).toBeNull();
  });

  it("lists papers with their stored PDF, and explains when there is none", async () => {
    const top = [
      {
        key: "ITEM1",
        version: 10,
        data: {
          key: "ITEM1",
          itemType: "journalArticle",
          title: "A <span style=\"font-variant:small-caps;\">fictional</span> survey study",
          DOI: "10.1234/ABC",
          date: "2024-05-01",
          creators: [{ lastName: "Nguyen", creatorType: "author" }],
        },
      },
      { key: "ITEM2", version: 11, data: { key: "ITEM2", itemType: "journalArticle", title: "Linked only", extra: "DOI: 10.9/XYZ" } },
      { key: "NOTE1", version: 12, data: { key: "NOTE1", itemType: "note" } },
    ];
    const { client } = fakeZotero({
      "/collections/INBX1/items/top": json(top),
      "/items/ITEM1/children": json([
        { key: "ATT1", version: 1, data: { key: "ATT1", itemType: "attachment", contentType: "application/pdf", linkMode: "imported_file", filename: "paper.pdf" } },
      ]),
      "/items/ITEM2/children": json([
        { key: "ATT2", version: 1, data: { key: "ATT2", itemType: "attachment", contentType: "application/pdf", linkMode: "linked_file" } },
      ]),
    });

    const papers = await listInbox(client, "INBX1");
    expect(papers).toHaveLength(2);
    expect(papers[0]).toMatchObject({
      itemKey: "ITEM1",
      title: "A fictional survey study",
      doi: "10.1234/abc",
      year: "2024",
      firstAuthor: "Nguyen",
      attachmentKey: "ATT1",
      problem: null,
    });
    expect(papers[1]).toMatchObject({ doi: "10.9/xyz", attachmentKey: null });
    expect(papers[1]!.problem).toContain("linked file");
  });
});
