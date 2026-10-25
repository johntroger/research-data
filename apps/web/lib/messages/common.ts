import { defineMessages } from "./define";

/** The frame of every page: metadata, menu, header, footer, rate-limit answer. */
export const common = defineMessages({
  "app.description": { vi: "Công cụ tham khảo: dữ liệu trích xuất từ bài báo khoa học, kèm bằng chứng trong PDF gốc.", en: "A reference tool: data extracted from academic papers, with the evidence in the original PDF." },
  "nav.search": { vi: "Tìm theo quan hệ", en: "Relationship search" },
  "nav.library": { vi: "Thư viện", en: "Library" },
  "nav.matrix": { vi: "Ma trận", en: "Matrix" },
  "nav.concepts": { vi: "Khái niệm", en: "Concepts" },
  "nav.map": { vi: "Bản đồ bằng chứng", en: "Evidence map" },
  "nav.about": { vi: "Giới thiệu", en: "About" },
  "header.admin": { vi: "Chất lượng (quản trị)", en: "Quality (admin)" },
  "header.logout": { vi: "Đăng xuất", en: "Sign out" },
  "footer.disclaimer": {
    vi: "Dữ liệu do AI trích xuất, chỉ để tham khảo. Người dùng có trách nhiệm đối chiếu với bài gốc trước khi sử dụng trong nghiên cứu. Ai cũng dùng được, không cần đăng nhập.",
    en: "Data extracted by AI, for reference only. Users are responsible for checking it against the original paper before using it in research. Anyone can use this site, no sign-in needed.",
  },
  "footer.release": { vi: "Dữ liệu {label} ({date}).", en: "Data {label} ({date})." },
  "footer.cite": { vi: "Cách trích dẫn", en: "How to cite" },
  "footer.login": { vi: "Chủ dự án: đăng nhập", en: "Project owner: sign in" },
  "rate.tooMany": { vi: "Bạn gửi quá nhiều yêu cầu. Hãy thử lại sau {sec} giây.", en: "You sent too many requests. Please try again in {sec} seconds." },
  "release.label": { vi: "bản {id}, {papers} bài, {tests} kiểm định", en: "release {id}, {papers} papers, {tests} tests" },
  "lang.switch": { vi: "Ngôn ngữ", en: "Language" },
  "release.noteWhich": { vi: "Dữ liệu {label}, đóng ngày {date}. ", en: "Data {label}, cut on {date}. " },
  "release.noteCite": { vi: "Cách trích dẫn: ", en: "How to cite: " },
  "release.stale": {
    vi: "Liên kết này ghi kết quả tính trên bản dữ liệu {linked}; dữ liệu đã cập nhật lên bản {latest} ({date}), nên con số dưới đây có thể khác. Nếu cần đúng số của bản {linked}, hãy dùng tệp xuất đã tải lúc đó.",
    en: "This link records a result computed on data release {linked}; the data has since been updated to release {latest} ({date}), so the numbers below may differ. If you need the exact numbers of release {linked}, use the file you exported at that time.",
  },
});
