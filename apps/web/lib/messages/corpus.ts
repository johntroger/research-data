import { defineMessages } from "./define";

/** The "what is in this repository" block, shown under the search form and the results. */
export const corpus = defineMessages({
  "corpus.summary": { vi: "Kho này gồm gì: {papers}", en: "What this repository holds: {papers}" },
  "corpus.years": { vi: ", năm {min}–{max}", en: ", years {min}–{max}" },
  "corpus.recent": { vi: "{recent} bài từ {from} trở lại; {before} bài trước đó", en: "{recent} papers from {from} on; {before} papers before that" },
  "corpus.noYear": { vi: "; {n} bài chưa rõ năm", en: "; {n} papers with no known year" },
  "corpus.types": { vi: "Loại bài: {list}.", en: "Paper types: {list}." },
  "corpus.designs": { vi: "Thiết kế (số bài): {list}.", en: "Designs (papers): {list}." },
  "corpus.samples": { vi: "Mẫu (số bài): {list}; {countries} quốc gia.", en: "Samples (papers): {list}; {countries} countries." },
  "corpus.caveat.lead": { vi: "Không phải mẫu hệ thống của y văn:", en: "Not a systematic sample of the literature:" },
  "corpus.caveat.rest": {
    vi: " kho gồm các bài trong thư viện Zotero của chủ dự án (marketing, đạo đức, hành vi người tiêu dùng; định lượng, tiếng Anh), chọn theo nhu cầu nghiên cứu, không qua tìm kiếm hay sàng lọc theo quy trình PRISMA. Số bài nhỏ nên một kết quả \"ủng hộ\" hay \"không ủng hộ\" chỉ nói về các bài này.",
    en: " the repository holds the papers in the project owner’s Zotero library (marketing, ethics, consumer behaviour; quantitative, English), chosen for the owner’s research needs, not through a PRISMA-style search or screening. With so few papers, a “supported” or “not supported” result speaks only about these papers.",
  },
  "corpus.more.before": { vi: "Xem từng bài và lọc theo năm, thiết kế, mẫu trong ", en: "See each paper and filter by year, design, sample in the " },
  "corpus.more.link": { vi: "danh sách bài", en: "paper list" },
  "corpus.more.after": { vi: ".", en: "." },
  "forest.title": { vi: "Biểu đồ rừng", en: "Forest plot" },
  "forest.caption": {
    vi: "({kind}, {n} study có khoảng tin cậy hoặc sai số chuẩn). Đây là hình các study báo cáo, không phải meta-analysis: không có ước lượng gộp.",
    en: "({kind}, {n} studies with a confidence interval or standard error). This is a picture of what the studies report, not a meta-analysis: there is no pooled estimate.",
  },
  "forest.aria": { vi: "Biểu đồ rừng của {n} study", en: "Forest plot of {n} studies" },
  "forest.note": { vi: "Đường đứt: khoảng tính từ sai số chuẩn (ước lượng ± 1,96 SE) vì bài không in khoảng tin cậy.", en: "Dashed line: interval computed from the standard error (estimate ± 1.96 SE) because the paper does not print a confidence interval." },
});
