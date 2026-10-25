/** Numbered releases of the data (step P4.1) and how to cite the tool (step P4.2). Pure, no I/O. */

export interface DataRelease {
  id: string;
  released_at: string;
  papers: number;
  tests: number;
  canonical_version: string;
  note: string;
}

const nf = new Intl.NumberFormat("vi-VN");

/** "bản 2026.10.25, 36 bài, 1.007 kiểm định" */
export function releaseLabel(r: DataRelease): string {
  return `bản ${r.id}, ${nf.format(r.papers)} bài, ${nf.format(r.tests)} kiểm định`;
}

/** The release date as dd/mm/yyyy in Vietnam time. */
export function releaseDate(r: Pick<DataRelease, "released_at">): string {
  const d = new Date(new Date(r.released_at).getTime() + 7 * 3_600_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export const SITE_URL = "https://research-data-five.vercel.app";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * How to cite the tool, in APA 7 form for a data set (author, year, title, version, type, URL), with the day it was consulted because the
 * content changes between versions. The year is the year of the release.
 */
export function toolCitation(release: Pick<DataRelease, "id" | "released_at"> | null, accessed: Date, url: string = SITE_URL): string {
  const year = release ? new Date(release.released_at).getUTCFullYear() : accessed.getUTCFullYear();
  const version = release ? ` (Version ${release.id})` : "";
  const day = `${MONTHS[accessed.getUTCMonth()]} ${accessed.getUTCDate()}, ${accessed.getUTCFullYear()}`;
  return `Tran, T. T. (${year}). Research Data: Academic literature matrix${version} [Data set]. Retrieved ${day}, from ${url}`;
}

/** One line for the notes of an exported file: which release the numbers come from and how to cite them. */
export function provenanceNote(release: DataRelease | null, accessed: Date, url?: string): string {
  const which = release ? `Dữ liệu ${releaseLabel(release)}, đóng ngày ${releaseDate(release)}. ` : "";
  return `${which}Cách trích dẫn: ${toolCitation(release, accessed, url)}`;
}

/**
 * A permanent link names the release its result was computed on (parameter `v`). When that is not the latest release any more the page
 * says so: the numbers may differ now. Returns null when there is nothing to warn about.
 */
export function staleWarning(linked: string | null, latest: Pick<DataRelease, "id" | "released_at"> | null): string | null {
  if (!linked || !latest || linked === latest.id) return null;
  return `Liên kết này ghi kết quả tính trên bản dữ liệu ${linked}; dữ liệu đã cập nhật lên bản ${latest.id} (${releaseDate({ released_at: latest.released_at })}), nên con số dưới đây có thể khác. Nếu cần đúng số của bản ${linked}, hãy dùng tệp xuất đã tải lúc đó.`;
}
