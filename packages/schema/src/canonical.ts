/**
 * Initial canonical theories and constructs of the starting domain (step 0.14, Mục 1.3, Mục 5.3).
 * The lists seed the `theories` and `constructs` tables; they grow as papers are added.
 * Definitions are short paraphrases written for this project (not quotes), each with its source.
 */
import { z } from "zod";
import { CANONICAL_CONSTRUCTS, CANONICAL_THEORIES, RETIRED_ALIASES } from "./canonical-data.js";

export const CANONICAL_LIST_VERSION = "1.1.0";

export const CONSTRUCT_DOMAINS = ["social_media", "branding", "ethics", "consumer_behavior"] as const;

/** Where an entry comes from: named in Mục 1.3 of the plan, or added because it is common in the domain. */
const Origin = z.enum(["plan_1_3", "added"]);

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const CanonicalTheory = z.object({
  id: Id,
  canonical_name: z.string().min(1),
  /** Other names authors use for the same theory (abbreviations, spelling variants). */
  aliases: z.array(z.string().min(1)),
  summary: z.string().min(1),
  key_sources: z.array(z.string().min(1)).min(1),
  origin: Origin,
});
export type CanonicalTheory = z.infer<typeof CanonicalTheory>;

export const CanonicalConstruct = z.object({
  id: Id,
  canonical_name: z.string().min(1),
  /**
   * Only exact synonyms and abbreviations. Other names are mapped later by the system (Mục 5.3),
   * following "không chắc thì tách".
   */
  aliases: z.array(z.string().min(1)),
  domain: z.enum(CONSTRUCT_DOMAINS),
  parent_id: Id.nullable(),
  canonical_definition: z.string().min(1),
  definition_source: z.string().min(1),
  origin: Origin,
});
export type CanonicalConstruct = z.infer<typeof CanonicalConstruct>;

export { CANONICAL_CONSTRUCTS, CANONICAL_THEORIES, RETIRED_ALIASES };

/** Name form used to detect duplicates and to match author labels: case, dashes, "&" and spaces unified. */
export function canonicalKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const DOMAIN_TITLES: Record<(typeof CONSTRUCT_DOMAINS)[number], string> = {
  social_media: "Social media",
  branding: "Thương hiệu",
  ethics: "Đạo đức",
  consumer_behavior: "Hành vi khách hàng",
};

const cell = (text: string) => text.replace(/\|/g, "\\|");
const originMark = (origin: string) => (origin === "added" ? " ⁺" : "");

/** The lists as Markdown for docs/canonical-lists.md (generated: `pnpm canonical:build`). */
export function renderCanonicalMarkdown(): string {
  const byId = new Map(CANONICAL_CONSTRUCTS.map((c) => [c.id, c]));
  const out: string[] = [
    "# Danh sách lý thuyết và khái niệm chuẩn khởi tạo",
    "",
    `> File sinh tự động từ \`packages/schema/src/canonical-data.ts\` bằng \`pnpm canonical:build\`; đừng sửa tay. Phiên bản danh sách ${CANONICAL_LIST_VERSION} (bước 0.14, Mục 1.3 và Mục 5.3).`,
    "",
    "- Định nghĩa là câu diễn đạt lại ngắn gọn của dự án, **không phải trích nguyên văn**; cột nguồn ghi công trình gốc để đối chiếu.",
    "- Bí danh chỉ gồm từ đồng nghĩa chính xác và chữ viết tắt. Các tên khác do hệ thống ánh xạ sau theo nguyên tắc \"không chắc thì tách\".",
    "- Dấu ⁺: mục thêm vào vì hay gặp trong miền, không có tên trong Mục 1.3.",
    "",
    `## Lý thuyết (${CANONICAL_THEORIES.length})`,
    "",
    "| Tên chuẩn | Bí danh | Nội dung chính | Nguồn |",
    "| :--- | :--- | :--- | :--- |",
    ...CANONICAL_THEORIES.map(
      (t) =>
        `| ${cell(t.canonical_name)}${originMark(t.origin)} | ${cell(t.aliases.join(", ") || "—")} | ${cell(t.summary)} | ${cell(t.key_sources.join("; "))} |`,
    ),
    "",
    `## Khái niệm (${CANONICAL_CONSTRUCTS.length})`,
  ];
  for (const domain of CONSTRUCT_DOMAINS) {
    const list = CANONICAL_CONSTRUCTS.filter((c) => c.domain === domain);
    out.push(
      "",
      `### ${DOMAIN_TITLES[domain]} (\`${domain}\`, ${list.length})`,
      "",
      "| Tên chuẩn | Thuộc | Bí danh | Định nghĩa | Nguồn |",
      "| :--- | :--- | :--- | :--- | :--- |",
      ...list.map(
        (c) =>
          `| ${cell(c.canonical_name)}${originMark(c.origin)} | ${c.parent_id ? cell(byId.get(c.parent_id)!.canonical_name) : "—"} | ${cell(c.aliases.join(", ") || "—")} | ${cell(c.canonical_definition)} | ${cell(c.definition_source)} |`,
      ),
    );
  }
  return `${out.join("\n")}\n`;
}
