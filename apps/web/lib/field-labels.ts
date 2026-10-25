/**
 * How the fields of a paper read on the workspace (P0, "một thẻ cho mỗi kiểm định"). Pure, so it is tested without a browser:
 *  - `fieldLabel` / `valueLabel`: the technical names and codes (`estimate_type`, `odds_ratio`) in words, unknown ones left as they are;
 *  - `groupFields`: the fields of one test (or one construct, one experimental cell) under one heading, in the order they first appear;
 *  - `groupBadge`: one badge for the group, the weakest of its fields;
 *  - `testSummary`: the numbers of a test on one line ("Ước lượng 1.69 · SE 0.18 · p < .01 · ✓ Ủng hộ").
 */
import { keyContext } from "./workspace";

export const FIELD_LABEL: Record<string, string> = {
  paper_type: "Loại bài",
  // results
  effect_type: "Loại quan hệ",
  estimate: "Ước lượng",
  estimate_type: "Loại ước lượng",
  se: "Sai số chuẩn (SE)",
  ci_low: "CI dưới",
  ci_high: "CI trên",
  p_value: "p",
  p_reported_as: "p (như tác giả báo cáo)",
  status: "Kết quả giả thuyết",
  interaction_type: "Kiểu tương tác",
  // study and sample
  research_design: "Thiết kế nghiên cứu",
  time_design: "Thiết kế theo thời gian",
  experimental_design: "Thiết kế thực nghiệm",
  manipulation_check: "Kiểm tra thao tác",
  analysis_method: "Phương pháp phân tích",
  exclusion_rate: "Tỷ lệ loại mẫu",
  unit_of_analysis: "Đơn vị phân tích",
  sample_type: "Loại mẫu",
  country_iso: "Quốc gia",
  n: "Cỡ mẫu (N)",
  sample_size: "Cỡ mẫu (N)",
  // theory
  theory_name_original: "Tên lý thuyết",
  application_role: "Vai trò của lý thuyết",
  // measurement
  construct_label_original: "Khái niệm",
  order: "Bậc",
  alpha: "Cronbach’s α",
  scale_source: "Nguồn thang đo",
  definition: "Định nghĩa",
  n_items: "Số câu hỏi",
  // tables
  mean: "Trung bình (M)",
  sd: "Độ lệch chuẩn (SD)",
  test_stat: "Thống kê kiểm định",
  effect_size_reported: "Cỡ hiệu ứng",
  effect_size_type: "Loại cỡ hiệu ứng",
  r: "Hệ số tương quan (r)",
  correlation_type: "Loại tương quan",
  diagonal_type: "Đường chéo",
  // contribution
  contribution_type: "Loại đóng góp",
  gap_type: "Loại khoảng trống",
  theoretical_contribution: "Đóng góp lý thuyết",
  practical_implication: "Hàm ý thực tiễn",
  limitation: "Hạn chế",
  future_direction: "Hướng nghiên cứu tiếp",
};

/** A readable name for a field; one without a translation shows its code with spaces, never nothing. */
export function fieldLabel(name: string): string {
  return FIELD_LABEL[name] ?? name.replace(/_/g, " ");
}

const EFFECT_TYPE: Record<string, string> = { direct: "Trực tiếp", indirect: "Gián tiếp", interaction: "Tương tác", total: "Tổng", control: "Biến kiểm soát", mediated: "Qua trung gian", moderated: "Có điều tiết" };
const ESTIMATE_TYPE: Record<string, string> = {
  std_beta: "β chuẩn hóa",
  unstd_b: "b chưa chuẩn hóa",
  path_coefficient: "Hệ số đường (path)",
  r: "Hệ số tương quan r",
  d: "Cohen’s d",
  odds_ratio: "Tỷ số chênh (OR)",
  eta_squared: "η² (eta bình phương)",
  other: "Loại khác",
};
const STATUS: Record<string, string> = { supported: "✓ Ủng hộ", not_supported: "✗ Không ủng hộ", partially_supported: "◐ Ủng hộ một phần", mixed: "◐ Kết quả trộn", not_hypothesized: "○ Không đặt giả thuyết" };
const TIME_DESIGN: Record<string, string> = { cross_sectional: "Cắt ngang", time_lagged: "Có độ trễ thời gian", longitudinal: "Theo dõi dọc" };
const DESIGN: Record<string, string> = {
  survey: "Khảo sát",
  lab_experiment: "Thực nghiệm phòng lab",
  online_experiment: "Thực nghiệm trực tuyến",
  field_experiment: "Thực nghiệm thực địa",
  secondary_data: "Dữ liệu thứ cấp",
  longitudinal_panel: "Panel dọc",
  qualitative: "Định tính",
  other: "Khác",
};
const MANIPULATION: Record<string, string> = { not_reported: "Không báo cáo", reported: "Có báo cáo" };
const ROLE: Record<string, string> = { mentioned: "Được nhắc tên", framing: "Làm khung", hypothesis_derivation: "Xây giả thuyết", tested: "Được kiểm định", extended: "Được mở rộng" };
const PAPER_TYPE: Record<string, string> = {
  empirical_quant: "Thực nghiệm định lượng",
  empirical_qual: "Thực nghiệm định tính",
  mixed: "Phương pháp hỗn hợp",
  conceptual: "Lý thuyết / khái niệm",
  narrative_review: "Tổng quan tường thuật",
  systematic_review: "Tổng quan hệ thống",
  meta_analysis: "Meta-analysis",
  other: "Khác",
};
const ORDER: Record<string, string> = { first: "Bậc một", higher: "Bậc cao" };
const BY_FIELD: Record<string, Record<string, string>> = {
  effect_type: EFFECT_TYPE,
  estimate_type: ESTIMATE_TYPE,
  status: STATUS,
  time_design: TIME_DESIGN,
  research_design: DESIGN,
  manipulation_check: MANIPULATION,
  application_role: ROLE,
  paper_type: PAPER_TYPE,
  order: ORDER,
};

/** A coded value in words, or null when the field has no table for it or the code is not in it (the caller then shows the value as it is). */
export function valueLabel(fieldName: string, value: unknown): string | null {
  if (typeof value !== "string") return null;
  return BY_FIELD[fieldName]?.[value] ?? null;
}

export interface GroupableField {
  natural_key: string;
  field_name: string;
  badge: string;
}

export interface FieldGroup<T extends GroupableField> {
  /** The part of the natural key the fields share ("study_1:h1:a->b:direct"); null for a field that stands alone. */
  context: string | null;
  fields: T[];
}

/**
 * The fields of a tab, the ones that belong to the same test, construct or table cell together. A group sits where its first field
 * was, its fields keep their order, and a field that shares its context with no other stands alone.
 */
export function groupFields<T extends GroupableField>(fields: T[]): FieldGroup<T>[] {
  const byContext = new Map<string, T[]>();
  for (const f of fields) {
    const c = keyContext(f.natural_key, f.field_name);
    byContext.set(c, [...(byContext.get(c) ?? []), f]);
  }
  const out: FieldGroup<T>[] = [];
  const placed = new Set<string>();
  for (const f of fields) {
    const c = keyContext(f.natural_key, f.field_name);
    const members = byContext.get(c)!;
    if (members.length === 1) {
      out.push({ context: null, fields: [f] });
    } else if (!placed.has(c)) {
      placed.add(c);
      out.push({ context: c, fields: members });
    }
  }
  return out;
}

/** One badge for a group: the weakest of its fields (something to look at beats an interpretation, which beats all verified). */
export function groupBadge(fields: Pick<GroupableField, "badge">[]): string {
  const badges = fields.map((f) => f.badge);
  if (badges.some((b) => b === "needs_attention" || b === "disputed" || b === "hidden")) return "needs_attention";
  if (badges.some((b) => b === "ai_interpreted")) return "ai_interpreted";
  return badges.every((b) => b === "human_reviewed") ? "human_reviewed" : "auto_verified";
}

/** The numbers of a test on one line, from the fields that carry them; empty when none of them is there. */
export function testSummary(fields: { field_name: string; value: unknown }[]): string {
  const get = (name: string) => fields.find((f) => f.field_name === name)?.value;
  const parts: string[] = [];
  const est = get("estimate");
  if (typeof est === "number" || typeof est === "string") {
    const type = valueLabel("estimate_type", get("estimate_type"));
    parts.push(`${type && type !== "Loại khác" ? type : "Ước lượng"} ${est}`);
  }
  const se = get("se");
  if (typeof se === "number" || typeof se === "string") parts.push(`SE ${se}`);
  const p = get("p_reported_as");
  if (typeof p === "string" && p) parts.push(`p ${p}`);
  const status = valueLabel("status", get("status"));
  if (status) parts.push(status);
  return parts.join(" · ");
}
