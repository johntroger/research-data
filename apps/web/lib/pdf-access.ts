/**
 * Who may view or download a paper's PDF (steps 3a.5, 2.2c). One function decides, so the page (button) and the route (the file)
 * cannot disagree. Since 25/10/2026 (owner's decision) anyone may VIEW the PDF of any paper, to check a number against the source;
 * only the project owner and papers whose licence is open may be DOWNLOADED. Viewing needs the file's bytes in the visitor's browser, so
 * "no download" means: no download button, no download route, no link to the browser's own viewer (which has a save button), and a link
 * that expires in 5 minutes; it cannot stop someone who is determined to save what their browser has been shown.
 * "Owner" is, until real sign-in exists (Giai đoạn 2), the machine that can reach the database directly: the same
 * rule that hides /admin from a deployed site. Anything unclear is a refusal.
 */
export interface PdfPaper {
  title: string | null;
  oa_status: string | null;
  license_source: string | null;
}

/** Open-access licence: the owner recorded the PDF as open access, with a status that really is open. */
export function isOpenLicence(paper: Pick<PdfPaper, "oa_status" | "license_source">): boolean {
  return paper.license_source === "oa" && ["gold", "green", "hybrid"].includes(paper.oa_status ?? "");
}

export function canDownloadPdf(isOwner: boolean, paper: Pick<PdfPaper, "oa_status" | "license_source">): boolean {
  return isOwner || isOpenLicence(paper);
}

/** Viewing is open to everyone for every paper that has a PDF (D14 as changed on 25/10/2026); the caller checks that the file exists. */
export function canViewPdf(): boolean {
  return true;
}

/** Where a visitor who may not see the PDF can read the paper: the open-access copy Unpaywall found, and the DOI. */
export function pdfLinks(paper: { oa_status?: string | null; oa_url?: string | null; doi?: string | null }): { oaUrl: string | null; doiUrl: string | null } {
  const open = ["gold", "green", "hybrid", "bronze"].includes(paper.oa_status ?? "");
  const oa = paper.oa_url?.trim() ?? "";
  return {
    oaUrl: open && (oa.startsWith("https://") || oa.startsWith("http://")) && URL.canParse(oa) ? oa : null,
    doiUrl: paper.doi?.trim() ? `https://doi.org/${paper.doi.trim()}` : null,
  };
}

/** A file name from the title: ASCII letters and digits, at most 80 characters. */
export function pdfFileName(title: string | null): string {
  const base = (title ?? "paper")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return `${base || "paper"}.pdf`;
}
