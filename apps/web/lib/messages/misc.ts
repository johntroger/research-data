import { defineMessages } from "./define";

/** The error page and the owner's sign-in page. */
export const misc = defineMessages({
  "c.error.title": { vi: "Không đọc được dữ liệu", en: "Could not read the data" },
  "c.error.1": { vi: "Trang này cần đọc dữ liệu từ cơ sở dữ liệu nhưng không kết nối được.", en: "This page needs to read data from the database but could not connect." },
  "c.error.2": { vi: "Nếu bạn đang chạy trên máy của mình, thường là cơ sở dữ liệu chưa bật:", en: "If you are running this on your own machine, the database is usually not started:" },
  "c.error.step1": { vi: "Mở Docker Desktop và đợi nó khởi động xong.", en: "Open Docker Desktop and wait until it has started." },
  "c.error.step2.before": { vi: "Trong thư mục dự án chạy ", en: "In the project folder run " },
  "c.error.step3": { vi: "Bấm «Thử lại» bên dưới.", en: "Press “Try again” below." },
  "c.error.retry": { vi: "Thử lại", en: "Try again" },
  "c.error.home": { vi: "Về trang chủ", en: "Back to the home page" },

  "login.title": { vi: "Đăng nhập", en: "Sign in" },
  "login.h1": { vi: "Đăng nhập chủ dự án", en: "Project owner sign-in" },
  "login.intro": {
    vi: "Chỉ chủ dự án có tài khoản; khách xem dữ liệu công khai không cần đăng nhập. Không có mật khẩu: web gửi một link đăng nhập tới email của chủ.",
    en: "Only the project owner has an account; visitors view the public data without signing in. There is no password: the site sends a sign-in link to the owner’s email.",
  },
  "login.already": { vi: "Đã đăng nhập bằng {email}.", en: "Signed in as {email}." },
  "login.home": { vi: "Về trang chủ", en: "Back to the home page" },
  "login.email": { vi: "Email", en: "Email" },
  "login.placeholder": { vi: "email của chủ dự án", en: "the owner’s email" },
  "login.send": { vi: "Gửi link đăng nhập", en: "Send the sign-in link" },
  "login.sent.before": { vi: "Nếu đây là email của chủ dự án, một link đăng nhập đã được gửi. Link dùng một lần và hết hạn sau 15 phút; hãy mở nó bằng ", en: "If this is the owner’s email, a sign-in link has been sent. The link works once and expires after 15 minutes; open it in " },
  "login.sent.strong": { vi: "chính trình duyệt này", en: "this same browser" },
  "login.error.empty": { vi: "Hãy nhập địa chỉ email.", en: "Please enter an email address." },
  "login.error.wait": { vi: "Vừa gửi link xong. Hãy đợi khoảng một phút rồi thử lại.", en: "A link was just sent. Wait about a minute and try again." },
  "login.error.denied": {
    vi: "Đăng nhập không thành công (link hết hạn, đã dùng, hoặc không phải tài khoản chủ). Hãy xin link mới.",
    en: "Sign-in failed (the link expired, was already used, or is not the owner’s account). Ask for a new link.",
  },
});

/**
 * What each automatic check verifies, in plain words. The checker stores its own detail line (with the numbers) in Vietnamese; in English
 * the page shows these descriptions and keeps that line, marked as Vietnamese, after them.
 */
export const checks = defineMessages({
  "c.check.quote_in_pdf": { vi: "Câu trích có trên trang PDF dẫn", en: "The quote is on the cited PDF page" },
  "c.check.number_in_pdf": { vi: "Con số có trên trang PDF dẫn", en: "The number is on the cited PDF page" },
  "c.check.quote_has_value": { vi: "Câu trích có chứa giá trị", en: "The quote contains the value" },
  "c.check.in_range": { vi: "Giá trị nằm trong khoảng hợp lệ", en: "The value is in its valid range" },
  "c.check.estimate_in_pdf": { vi: "Hệ số ước lượng có trên trang PDF dẫn", en: "The estimate is on the cited PDF page" },
  "c.check.sign_consistent": { vi: "Dấu quan sát khớp dấu của hệ số", en: "The observed sign matches the sign of the coefficient" },
  "c.check.cell_index": { vi: "Chỉ số ô của ma trận hợp lệ", en: "The matrix cell index is valid" },
  "c.check.status_consistent": { vi: "Kết quả giả thuyết khớp với giá trị p", en: "The hypothesis result agrees with the p value" },
  "c.check.text_in_pdf": { vi: "Chữ có trên trang PDF dẫn", en: "The text is on the cited PDF page" },
  "c.check.p_in_pdf": { vi: "Giá trị p có trên trang PDF dẫn", en: "The p value is on the cited PDF page" },
  "c.check.cell_position": { vi: "Số nằm đúng cột của ô trong bảng", en: "The number is in the right column of the table cell" },
  "c.check.positive": { vi: "Giá trị phải dương", en: "The value must be positive" },
  "c.check.sign_in_quote": { vi: "Dấu của giá trị khớp dấu trong câu trích", en: "The sign of the value matches the sign in the quote" },
  "c.check.index_base": { vi: "Cách đánh số ô được chuẩn hóa", en: "The cell numbering was normalised" },
  "c.check.cells_sum_to_n": { vi: "Tổng cỡ mẫu các ô điều kiện khớp cỡ mẫu study", en: "The cell sample sizes add up to the study’s sample size" },
  "c.check.stat_recomputed": { vi: "Thống kê kiểm định tính lại khớp giá trị p", en: "The recomputed test statistic agrees with the p value" },
  "c.check.se_from_ci": { vi: "Sai số chuẩn tính từ khoảng tin cậy khớp sai số in trong bài", en: "The standard error computed from the confidence interval matches the printed one" },
  "c.check.ci_contains": { vi: "Hệ số nằm trong khoảng tin cậy", en: "The coefficient lies inside the confidence interval" },
  "c.check.name_in_quote": { vi: "Tên biến có trong câu trích", en: "The variable name is in the quote" },
  "c.check.quote_meaning": { vi: "Câu trích không đổi nghĩa so với bản gốc", en: "The quote does not change meaning compared with the original" },
  "c.check.p_valid": { vi: "Giá trị p hợp lệ", en: "The p value is valid" },
  "c.check.has_evidence": { vi: "Có bằng chứng cho giá trị này", en: "There is evidence for this value" },
  "c.check.reliability_consistent": { vi: "Độ tin cậy ở bảng đo lường khớp với ở bảng khác", en: "The reliability in the measurement table matches the one in another table" },
  "c.check.ci_order": { vi: "Cận dưới không lớn hơn cận trên", en: "The lower bound is not above the upper bound" },
  "c.check.country_in_pdf": { vi: "Tên quốc gia có trong bài", en: "The country name appears in the paper" },
  "c.check.t_from_estimate_se": { vi: "t tính từ hệ số và sai số chuẩn khớp t in trong bài", en: "The t computed from the estimate and standard error matches the printed t" },
  "c.check.n_consistent": { vi: "Cỡ mẫu khớp giữa các bảng và study", en: "The sample size agrees between tables and study" },
  "c.check.beta_matches_r": { vi: "β khớp với r trong ma trận tương quan", en: "β agrees with r in the correlation matrix" },
});
