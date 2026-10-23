/**
 * Step 2.2c: records what Unpaywall says on each paper and sets who may download its PDF (license_source = 'oa' only for
 * an open licence, D14). Anything that is not open leaves license_source as the owner set it, except an earlier 'oa' that no
 * longer holds, which is cleared: the web must never offer a download the licence does not allow.
 */
import type pg from "pg";
import { fetchUnpaywall, isOpenLicense, type OaInfo } from "../metadata/unpaywall.js";

export interface OaPaper {
  id: string;
  title: string | null;
  doi: string | null;
  license_source: string | null;
}

export interface OaDecision {
  paper: OaPaper;
  /** null: no DOI, or Unpaywall has no record. */
  info: OaInfo | null;
  /** The license_source to store. */
  licenseSource: string | null;
  open: boolean;
  note: string;
}

export function decide(paper: OaPaper, info: OaInfo | null): OaDecision {
  const open = info ? isOpenLicense(info) : false;
  const keep = paper.license_source === "oa" ? null : paper.license_source;
  const note = !paper.doi ? "không có DOI" : !info ? "Unpaywall không có bản ghi" : open ? "giấy phép mở: khách xem và tải được" : info.oaStatus === "closed" ? "không OA" : `OA nhưng giấy phép "${info.license ?? "không nêu"}" không phải giấy phép mở`;
  return { paper, info, licenseSource: open ? "oa" : keep, open, note };
}

export async function lookupAll(papers: OaPaper[], email: string, log: (line: string) => void = () => {}): Promise<OaDecision[]> {
  const out: OaDecision[] = [];
  for (const paper of papers) {
    let info: OaInfo | null = null;
    if (paper.doi) {
      info = await fetchUnpaywall(paper.doi, { email });
      await new Promise((r) => setTimeout(r, 250)); // Unpaywall asks for at most 100,000 requests a day; be gentle anyway
    }
    const d = decide(paper, info);
    out.push(d);
    log(`${(paper.title ?? paper.id).slice(0, 52).padEnd(52)} ${(info?.oaStatus ?? "unknown").padEnd(7)} ${(info?.license ?? "-").padEnd(14)} ${d.note}`);
  }
  return out;
}

export async function saveOa(db: pg.Client, decisions: OaDecision[]): Promise<number> {
  let n = 0;
  for (const d of decisions) {
    const r = await db.query(
      "update papers set oa_status = $2, oa_license = $3, oa_url = $4, oa_checked_at = now(), license_source = $5 where id = $1",
      [d.paper.id, d.info?.oaStatus ?? "unknown", d.info?.license ?? null, d.info?.url ?? null, d.licenseSource],
    );
    n += r.rowCount ?? 0;
  }
  return n;
}
