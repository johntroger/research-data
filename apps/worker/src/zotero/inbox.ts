/**
 * Reads the project's Zotero inbox (collection "Research Data" › "Inbox", Mục 3.1) — read-only.
 */
import type { ZoteroClient } from "./client.js";

export const INBOX_PATH = ["Research Data", "Inbox"] as const;

/**
 * Inbox collection path from ZOTERO_INBOX_PATH ("Dissertation / 1 - Social Media Marketing Ethics"),
 * using "/" or "›" between levels; defaults to "Research Data › Inbox".
 */
export function inboxPath(value: string | undefined): string[] {
  const parts = (value ?? "")
    .split(/\s*[/›]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [...INBOX_PATH];
}

export interface CollectionNode {
  key: string;
  name: string;
  depth: number;
}

/** Every collection of the library as an indented tree (for choosing the inbox). */
export async function collectionTree(client: ZoteroClient): Promise<CollectionNode[]> {
  const collections = await client.getAll<ZoteroCollection>(`${client.libraryPrefix}/collections`);
  const children = new Map<string | false, ZoteroCollection[]>();
  for (const c of collections) {
    const list = children.get(c.data.parentCollection) ?? [];
    list.push(c);
    children.set(c.data.parentCollection, list);
  }
  const out: CollectionNode[] = [];
  const visit = (parent: string | false, depth: number) => {
    const list = (children.get(parent) ?? []).sort((a, b) => a.data.name.localeCompare(b.data.name));
    for (const c of list) {
      out.push({ key: c.key, name: c.data.name, depth });
      visit(c.key, depth + 1);
    }
  };
  visit(false, 0);
  return out;
}

interface ZoteroCollection {
  key: string;
  data: { key: string; name: string; parentCollection: string | false };
}

interface ZoteroItem {
  key: string;
  version: number;
  data: {
    key: string;
    itemType: string;
    title?: string;
    DOI?: string;
    date?: string;
    creators?: { lastName?: string; firstName?: string; name?: string; creatorType: string }[];
    publicationTitle?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    contentType?: string;
    linkMode?: string;
    filename?: string;
    parentItem?: string;
    extra?: string;
  };
}

export interface InboxPaper {
  itemKey: string;
  version: number;
  title: string;
  doi: string | null;
  year: string | null;
  firstAuthor: string | null;
  /** Key of the stored PDF attachment, or null when the item has no downloadable PDF. */
  attachmentKey: string | null;
  attachmentFilename: string | null;
  /** Why there is no downloadable PDF, when attachmentKey is null. */
  problem: string | null;
  /** Bibliographic fields as stored in Zotero (fallback when Crossref has no record). */
  zotero: {
    authors: { family: string; given: string | null }[];
    journal: string | null;
    volume: string | null;
    issue: string | null;
    pages: string | null;
  };
}

/** Finds a collection by its path of names (case-insensitive), e.g. ["Research Data", "Inbox"]. */
export async function findCollection(client: ZoteroClient, path: readonly string[]): Promise<string | null> {
  const collections = await client.getAll<ZoteroCollection>(`${client.libraryPrefix}/collections`);
  let parent: string | false = false;
  let key: string | null = null;
  for (const name of path) {
    const match = collections.find(
      (c) => c.data.parentCollection === parent && c.data.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (!match) return null;
    key = match.key;
    parent = match.key;
  }
  return key;
}

/** Zotero can only serve files it stores itself (imported); linked files live only on the user's disk. */
const STORED_LINK_MODES = new Set(["imported_file", "imported_url"]);

function doiFrom(item: ZoteroItem["data"]): string | null {
  if (item.DOI) return item.DOI.trim().toLowerCase();
  const fromExtra = item.extra ? /DOI:\s*(10\.\S+)/i.exec(item.extra) : null;
  return fromExtra ? fromExtra[1]!.toLowerCase() : null;
}

export async function listInbox(client: ZoteroClient, collectionKey: string): Promise<InboxPaper[]> {
  const top = await client.getAll<ZoteroItem>(`${client.libraryPrefix}/collections/${collectionKey}/items/top`);
  const papers: InboxPaper[] = [];

  for (const item of top) {
    if (item.data.itemType === "attachment" || item.data.itemType === "note") continue;

    const children = await client.getAll<ZoteroItem>(`${client.libraryPrefix}/items/${item.key}/children`);
    const pdfs = children.filter((c) => c.data.itemType === "attachment" && c.data.contentType === "application/pdf");
    const stored = pdfs.find((c) => STORED_LINK_MODES.has(c.data.linkMode ?? ""));

    const author = item.data.creators?.find((c) => c.creatorType === "author") ?? item.data.creators?.[0];
    papers.push({
      itemKey: item.key,
      version: item.version,
      // Zotero titles may carry rich-text markup, e.g. <span style="font-variant:small-caps;">.
      title: (item.data.title ?? "(no title)").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      doi: doiFrom(item.data),
      year: item.data.date ? (/\d{4}/.exec(item.data.date)?.[0] ?? null) : null,
      firstAuthor: author?.lastName ?? author?.name ?? null,
      zotero: {
        authors: (item.data.creators ?? [])
          .filter((c) => c.creatorType === "author")
          .map((c) => ({ family: c.lastName ?? c.name ?? "", given: c.firstName ?? null })),
        journal: item.data.publicationTitle || null,
        volume: item.data.volume || null,
        issue: item.data.issue || null,
        pages: item.data.pages || null,
      },
      attachmentKey: stored?.key ?? null,
      attachmentFilename: stored?.data.filename ?? null,
      problem: stored
        ? null
        : pdfs.length > 0
          ? "PDF is a linked file (not in Zotero Storage); the Web API cannot download it"
          : "no PDF attachment",
    });
  }
  return papers;
}
