/** Numbered releases of the data (step P4.1) and how to cite the tool (step P4.2). Pure, no I/O. The texts follow the language (P5). */
import { translate, type Lang } from "./i18n";

export interface DataRelease {
  id: string;
  released_at: string;
  papers: number;
  tests: number;
  canonical_version: string;
  note: string;
}

const LOCALE: Record<Lang, string> = { vi: "vi-VN", en: "en-US" };

/** "bản 2026.10.25, 36 bài, 1.007 kiểm định" / "release 2026.10.25, 36 papers, 1,007 tests" */
export function releaseLabel(r: DataRelease, lang: Lang = "vi"): string {
  const nf = new Intl.NumberFormat(LOCALE[lang]);
  return translate(lang, "release.label", { id: r.id, papers: nf.format(r.papers), tests: nf.format(r.tests) });
}

/** The release date in Vietnam time: dd/mm/yyyy in Vietnamese, "25 Oct 2026" in English. */
export function releaseDate(r: Pick<DataRelease, "released_at">, lang: Lang = "vi"): string {
  const d = new Date(new Date(r.released_at).getTime() + 7 * 3_600_000);
  if (lang === "en") return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]!.slice(0, 3)} ${d.getUTCFullYear()}`;
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export const SITE_URL = "https://research-data-five.vercel.app";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * How to cite the tool, in APA 7 form for a data set (author, year, title, version, type, URL), with the day it was consulted because the
 * content changes between versions. The year is the year of the release. English in both languages: it goes into English papers.
 */
export function toolCitation(release: Pick<DataRelease, "id" | "released_at"> | null, accessed: Date, url: string = SITE_URL): string {
  const year = release ? new Date(release.released_at).getUTCFullYear() : accessed.getUTCFullYear();
  const version = release ? ` (Version ${release.id})` : "";
  const day = `${MONTHS[accessed.getUTCMonth()]} ${accessed.getUTCDate()}, ${accessed.getUTCFullYear()}`;
  return `Tran, T. T. (${year}). Research Data: Academic literature matrix${version} [Data set]. Retrieved ${day}, from ${url}`;
}

/** One line for the notes of an exported file: which release the numbers come from and how to cite them. */
export function provenanceNote(release: DataRelease | null, accessed: Date, url?: string, lang: Lang = "vi"): string {
  const which = release ? translate(lang, "release.noteWhich", { label: releaseLabel(release, lang), date: releaseDate(release, lang) }) : "";
  return `${which}${translate(lang, "release.noteCite")}${toolCitation(release, accessed, url)}`;
}

/**
 * A permanent link names the release its result was computed on (parameter `v`). When that is not the latest release any more the page
 * says so: the numbers may differ now. Returns null when there is nothing to warn about.
 */
export function staleWarning(linked: string | null, latest: Pick<DataRelease, "id" | "released_at"> | null, lang: Lang = "vi"): string | null {
  if (!linked || !latest || linked === latest.id) return null;
  return translate(lang, "release.stale", { linked, latest: latest.id, date: releaseDate({ released_at: latest.released_at }, lang) });
}
