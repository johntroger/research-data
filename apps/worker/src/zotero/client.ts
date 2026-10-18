/**
 * Minimal read-only client for the Zotero Web API v3 (Mục 3.3).
 * - Sends `Zotero-API-Key` and `Zotero-API-Version: 3`.
 * - Honours `Backoff` and `Retry-After` (429 / 503) before the next request.
 * - Follows pagination through the `Link: <…>; rel="next"` header.
 * `fetchImpl` and `sleep` are injectable so tests run without the network.
 */

export const ZOTERO_API = "https://api.zotero.org";

export interface ZoteroConfig {
  apiKey: string;
  /** Numeric user ID shown on https://www.zotero.org/settings/keys */
  userId: string;
}

export interface ZoteroClientOptions {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

export class ZoteroError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ZoteroError";
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function nextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (match) return match[1]!;
  }
  return null;
}

export class ZoteroClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly maxRetries: number;
  /** Earliest time (ms since epoch) the next request may be sent, from a Backoff header. */
  private notBefore = 0;

  constructor(
    readonly config: ZoteroConfig,
    options: ZoteroClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.maxRetries = options.maxRetries ?? 3;
  }

  get libraryPrefix(): string {
    return `/users/${this.config.userId}`;
  }

  /** Sends one GET request, waiting for Backoff / Retry-After and retrying 429 / 503. */
  async request(pathOrUrl: string, init: { binary?: boolean; manualRedirect?: boolean } = {}): Promise<Response> {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${ZOTERO_API}${pathOrUrl}`;
    for (let attempt = 0; ; attempt++) {
      const wait = this.notBefore - Date.now();
      if (wait > 0) await this.sleep(wait);

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: {
            "Zotero-API-Key": this.config.apiKey,
            "Zotero-API-Version": "3",
            ...(init.binary ? {} : { Accept: "application/json" }),
          },
          redirect: init.manualRedirect ? "manual" : "follow",
        });
      } catch (error) {
        // Network failure (connection reset, DNS…): retry with exponential backoff.
        if (attempt < this.maxRetries) {
          await this.sleep(2 ** attempt * 1000);
          continue;
        }
        throw error;
      }

      const backoff = Number(response.headers.get("Backoff"));
      if (backoff > 0) this.notBefore = Date.now() + backoff * 1000;

      if ((response.status === 429 || response.status === 503) && attempt < this.maxRetries) {
        const retryAfter = Number(response.headers.get("Retry-After")) || 2 ** attempt;
        await this.sleep(retryAfter * 1000);
        continue;
      }
      const isRedirect = init.manualRedirect && response.status >= 300 && response.status < 400;
      if (!response.ok && !isRedirect) {
        throw new ZoteroError(`Zotero ${response.status} for ${url.replace(ZOTERO_API, "")}`, response.status);
      }
      return response;
    }
  }

  /** GET a JSON array, following every "next" page. */
  async getAll<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | null = `${path}${path.includes("?") ? "&" : "?"}limit=100`;
    while (url) {
      const response = await this.request(url);
      items.push(...((await response.json()) as T[]));
      url = nextLink(response.headers.get("Link"));
    }
    return items;
  }

  /** Permissions of the API key in use (GET /keys/current). */
  async keyInfo(): Promise<ZoteroKeyInfo> {
    return (await (await this.request("/keys/current")).json()) as ZoteroKeyInfo;
  }

  /**
   * Downloads an attachment's file. Zotero answers with a redirect to its storage (Amazon S3);
   * the redirect is followed WITHOUT the API key, so the key is only ever sent to api.zotero.org.
   */
  async downloadFile(attachmentKey: string): Promise<Uint8Array> {
    // The whole download (new signed URL + body) is retried, because storage connections can drop
    // half-way through the body (seen in step 0.12: "other side closed" after 1.6 MB).
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.request(`${this.libraryPrefix}/items/${attachmentKey}/file`, {
          binary: true,
          manualRedirect: true,
        });
        const location = response.headers.get("Location");
        if (response.status >= 300 && response.status < 400 && location) {
          const file = await this.fetchImpl(location);
          if (!file.ok) {
            throw new ZoteroError(`File storage ${file.status} for attachment ${attachmentKey}`, file.status);
          }
          return new Uint8Array(await file.arrayBuffer());
        }
        return new Uint8Array(await response.arrayBuffer());
      } catch (error) {
        const retryable = !(error instanceof ZoteroError) || error.status >= 500;
        if (!retryable || attempt >= this.maxRetries) throw error;
        await this.sleep(2 ** attempt * 1000);
      }
    }
  }
}

export interface ZoteroKeyInfo {
  userID: number;
  username?: string;
  access: {
    user?: { library?: boolean; files?: boolean; notes?: boolean; write?: boolean };
    groups?: Record<string, { library?: boolean; write?: boolean }>;
  };
}

/**
 * Giai đoạn 1–1b use a READ-ONLY key (Mục 3.3). Returns the problems that make the key unsuitable.
 */
export function readOnlyKeyProblems(info: ZoteroKeyInfo, userId: string): string[] {
  const problems: string[] = [];
  const user = info.access.user ?? {};
  if (String(info.userID) !== userId) problems.push(`key belongs to user ${info.userID}, not ZOTERO_USER_ID=${userId}`);
  if (!user.library) problems.push("key cannot read the personal library (tick 'Allow library access')");
  if (user.write) problems.push("key has WRITE access; create a read-only key for this phase");
  for (const [group, access] of Object.entries(info.access.groups ?? {})) {
    if (access.write) problems.push(`key has write access to group ${group}`);
  }
  return problems;
}
