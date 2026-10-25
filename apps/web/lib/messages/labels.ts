import { defineMessages } from "./define";

/** Names of values that appear in several pages and files: results of a hypothesis, effect types, designs, samples, badges... */
export const labels = defineMessages({
  // Result of a hypothesis test
  "status.supported": { vi: "✓ Ủng hộ", en: "✓ Supported" },
  "status.not_supported": { vi: "✗ Không ủng hộ", en: "✗ Not supported" },
  "status.partially_supported": { vi: "◐ Một phần", en: "◐ Partly" },
  "status.mixed": { vi: "◐ Trộn", en: "◐ Mixed" },
  "status.not_hypothesized": { vi: "○ Không đặt giả thuyết", en: "○ No hypothesis" },
  "status.mixedForm": { vi: "◐ Một phần / Trộn", en: "◐ Partly / Mixed" },
  // Direction of the effect
  "sign.positive": { vi: "＋ Dương", en: "＋ Positive" },
  "sign.negative": { vi: "－ Âm", en: "－ Negative" },
  "sign.none": { vi: "∅ Không có ý nghĩa", en: "∅ Not significant" },
  "sign.unknown": { vi: "? Không rõ", en: "? Unclear" },
  // Kind of effect in the model
  "effect.direct": { vi: "trực tiếp", en: "direct" },
  "effect.indirect": { vi: "gián tiếp", en: "indirect" },
  "effect.interaction": { vi: "tương tác", en: "interaction" },
  "effect.total": { vi: "tổng", en: "total" },
  "effect.control": { vi: "biến kiểm soát", en: "control variable" },
  // Kind of estimate
  "estimate.std_beta": { vi: "β chuẩn hóa", en: "standardized β" },
  "estimate.path_coefficient": { vi: "hệ số đường dẫn", en: "path coefficient" },
  "estimate.r": { vi: "r (tương quan)", en: "r (correlation)" },
  "estimate.other": { vi: "khác (b, η², OR…)", en: "other (b, η², OR…)" },
  "estimate.none": { vi: "chưa có số", en: "no number" },
  // Sorting
  "sort.year": { vi: "Năm (mới nhất trước)", en: "Year (newest first)" },
  "sort.n": { vi: "Cỡ mẫu (lớn nhất trước)", en: "Sample size (largest first)" },
  "sort.effect": { vi: "Cỡ hiệu ứng (|ước lượng| lớn nhất trước)", en: "Effect size (largest |estimate| first)" },
  "sort.name": { vi: "Tác giả (A–Z)", en: "Author (A–Z)" },
  // Study designs
  "design.survey": { vi: "Khảo sát", en: "Survey" },
  "design.online_experiment": { vi: "Thực nghiệm trực tuyến", en: "Online experiment" },
  "design.lab_experiment": { vi: "Thực nghiệm phòng lab", en: "Lab experiment" },
  "design.field_experiment": { vi: "Thực nghiệm hiện trường", en: "Field experiment" },
  "design.longitudinal_panel": { vi: "Dữ liệu bảng / dọc", en: "Panel / longitudinal data" },
  "design.secondary_data": { vi: "Dữ liệu thứ cấp", en: "Secondary data" },
  "design.qualitative": { vi: "Định tính", en: "Qualitative" },
  "design.other": { vi: "Khác", en: "Other" },
  "design.unknown": { vi: "(không rõ)", en: "(unknown)" },
  // Sample types
  "sample.students": { vi: "Sinh viên", en: "Students" },
  "sample.mturk": { vi: "MTurk", en: "MTurk" },
  "sample.prolific": { vi: "Prolific", en: "Prolific" },
  "sample.consumer_panel": { vi: "Panel người tiêu dùng", en: "Consumer panel" },
  "sample.online_convenience": { vi: "Mẫu thuận tiện trực tuyến", en: "Online convenience sample" },
  "sample.social_media_users": { vi: "Người dùng mạng xã hội", en: "Social media users" },
  "sample.managers": { vi: "Nhà quản lý", en: "Managers" },
  "sample.secondary": { vi: "Dữ liệu thứ cấp", en: "Secondary data" },
  "sample.other": { vi: "Khác", en: "Other" },
  "sample.unknown": { vi: "(không rõ)", en: "(unknown)" },
  // Paper types
  "ptype.empirical_quant": { vi: "Thực nghiệm định lượng", en: "Quantitative empirical" },
  "ptype.empirical_qual": { vi: "Thực nghiệm định tính", en: "Qualitative empirical" },
  "ptype.mixed": { vi: "Phương pháp hỗn hợp", en: "Mixed methods" },
  "ptype.conceptual": { vi: "Lý thuyết / khái niệm", en: "Conceptual / theoretical" },
  "ptype.systematic_review": { vi: "Tổng quan hệ thống", en: "Systematic review" },
  "ptype.meta_analysis": { vi: "Phân tích tổng hợp (meta)", en: "Meta-analysis" },
  "ptype.literature_review": { vi: "Tổng quan tài liệu", en: "Literature review" },
  "ptype.unknown": { vi: "(không rõ)", en: "(unknown)" },
  // Badges
  "badge.auto_verified": { vi: "✓ đã kiểm chứng", en: "✓ verified" },
  "badge.needs_attention": { vi: "⚠ nên xem kỹ", en: "⚠ check carefully" },
  "badge.ai_interpreted": { vi: "◇ AI diễn giải", en: "◇ AI interpretation" },
  "badge.hidden": { vi: "ẩn", en: "hidden" },
  "badge.human_reviewed": { vi: "★ đã sửa", en: "★ edited by hand" },
  "badge.disputed": { vi: "⚑ có báo lỗi", en: "⚑ error reported" },
  // Parts a concept plays in a test
  "role.iv": { vi: "biến độc lập", en: "independent variable" },
  "role.dv": { vi: "biến phụ thuộc", en: "dependent variable" },
  "role.med": { vi: "trung gian", en: "mediator" },
  "role.mod": { vi: "điều tiết", en: "moderator" },
});
