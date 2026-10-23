/**
 * Who may view or download a paper's PDF (steps 3a.5, 2.2c). One function decides, so the page (button) and the route (the file)
 * cannot disagree. The project owner may download every paper; a visitor only a paper whose licence is open.
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

/** Viewing follows the same rule as downloading (D14): a visitor sees the PDF only when its licence is open. */
export const canViewPdf = canDownloadPdf;

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
