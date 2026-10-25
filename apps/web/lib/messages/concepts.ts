import { defineMessages } from "./define";

/** The Concepts page and the Evidence map page. */
export const conceptPages = defineMessages({
  "concepts.title": { vi: "Khái niệm chuẩn và tên gọi đã gộp", en: "Canonical concepts and merged names" },
  "concepts.intro.before": {
    vi: "Mỗi bài gọi cùng một khái niệm bằng tên khác nhau (ví dụ “customer trust” và “brand trust”). Khi bật “Bao gồm tên gọi tương đương”, tìm kiếm coi các tên dưới đây là một. Danh sách chỉ gộp khi hai tên cùng nghĩa; khái niệm con (ví dụ state gratitude), điều kiện thực nghiệm và biến nhân khẩu học được giữ riêng (“không chắc thì tách”). Nếu bạn thấy một chỗ gộp chưa đúng, hãy báo cho chủ dự án qua email ở trang ",
    en: "Papers call the same concept by different names (for example “customer trust” and “brand trust”). When “Include equivalent names” is on, the search treats the names below as one. A name is merged only when it means the same thing; sub-concepts (for example state gratitude), experimental conditions and demographic variables are kept apart (“when in doubt, keep them separate”). If you think a merge is wrong, tell the project owner by email, given on the ",
  },
  "concepts.intro.link": { vi: "Giới thiệu", en: "About" },
  "concepts.intro.after": { vi: ".", en: " page." },
  "concepts.total": {
    vi: "{n} khái niệm chuẩn, {used} khái niệm đã gắn với ít nhất một kiểm định. Tên các biến mà tác giả dùng nhưng chưa nằm trong danh sách vẫn tìm được theo chữ đã gõ.",
    en: "{n} canonical concepts, {used} of them linked to at least one test. Variable names the authors used that are not in the list can still be found by the text you type.",
  },
  "concepts.col.concept": { vi: "Khái niệm chuẩn", en: "Canonical concept" },
  "concepts.col.aliases": { vi: "Các tên đã gộp", en: "Merged names" },
  "concepts.col.used": { vi: "Tên tác giả đã dùng (số kiểm định)", en: "Names the authors used (tests)" },
  "concepts.col.tests": { vi: "Kiểm định", en: "Tests" },
  "concepts.col.papers": { vi: "Bài", en: "Papers" },
  "concepts.none": { vi: "không có", en: "none" },
  "concepts.noneYet": { vi: "chưa có", en: "none yet" },

  "map.title": { vi: "Bản đồ bằng chứng", en: "Evidence map" },
  "map.intro.1": {
    vi: "Mỗi ô là một cặp khái niệm chuẩn (hàng: khái niệm làm biến độc lập, cột: khái niệm làm biến phụ thuộc) có ít nhất một kiểm định tác động trực tiếp trong kho. Số lớn là số kiểm định, số nhỏ là số bài; ",
    en: "Each cell is a pair of canonical concepts (row: concept used as the independent variable, column: concept used as the dependent variable) with at least one direct-effect test in the repository. The large number is the number of tests, the small one the number of papers; ",
  },
  "map.intro.2": { vi: " là số kiểm định giả thuyết đã kiểm chứng và được ủng hộ, ", en: " is the number of verified hypothesis tests that were supported, " },
  "map.intro.3": {
    vi: " là không được ủng hộ. Màu từ đỏ (phần lớn không ủng hộ) đến xanh (phần lớn ủng hộ); ô xám chưa có kiểm định giả thuyết nào đã kiểm chứng. ",
    en: " is not supported. Colour runs from red (mostly not supported) to green (mostly supported); a grey cell has no verified hypothesis test yet. ",
  },
  "map.intro.gap": { vi: "Ô trống là khoảng trống của kho này, chưa chắc là khoảng trống của lĩnh vực.", en: "An empty cell is a gap in this repository, not necessarily a gap in the field." },
  "map.intro.4": { vi: " Bấm một ô để xem từng kiểm định.", en: " Click a cell to see each test." },
  "map.summary.before": {
    vi: "{filled} / {total} ô có kiểm định. Bản đồ đặt được {placed} kiểm định trực tiếp; còn {notPlaced} kiểm định chưa đặt được vì một đầu chưa gắn khái niệm chuẩn (xem ",
    en: "{filled} / {total} cells have tests. The map places {placed} direct tests; {notPlaced} could not be placed because one end has no canonical concept yet (see the ",
  },
  "map.summary.link": { vi: "danh sách khái niệm", en: "list of concepts" },
  "map.summary.after": { vi: "; các nhãn đó vẫn tìm được ở trang Tìm theo quan hệ).", en: "; those names can still be found on the Relationship search page)." },
  "map.none": { vi: "Chưa có cặp khái niệm nào có kiểm định.", en: "No pair of concepts has tests yet." },
  "map.corner": { vi: "Độc lập ↓ · Phụ thuộc →", en: "Independent ↓ · Dependent →" },
  "map.emptyCell": { vi: "{iv} → {dv}: không có kiểm định", en: "{iv} → {dv}: no tests" },
  "map.cellTitle": { vi: "{iv} → {dv}: {tests} từ {papers}", en: "{iv} → {dv}: {tests} from {papers}" },
  "map.papers.sg": { vi: " · {n} bài", en: " · {n} paper" },
  "map.papers.pl": { vi: " · {n} bài", en: " · {n} papers" },
});
