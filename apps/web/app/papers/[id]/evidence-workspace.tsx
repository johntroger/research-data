"use client";

import { useState } from "react";
import type { ExtractedField } from "@/lib/data";

const BADGE_LABEL: Record<ExtractedField["badge"], string> = {
  auto_verified: "✓ đã kiểm chứng",
  needs_attention: "⚠ nên xem kỹ",
  ai_interpreted: "◇ AI diễn giải",
  hidden: "ẩn",
  human_reviewed: "★ đã sửa",
  disputed: "⚑ có báo lỗi",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "iv" in value && "dv" in value) {
    const h = value as { iv: string; dv: string; estimate?: number | null; p_reported?: string | null; status?: string };
    const stats = [h.estimate != null ? `β = ${h.estimate}` : null, h.p_reported ? `p ${h.p_reported}` : null]
      .filter(Boolean)
      .join(", ");
    return `${h.iv} → ${h.dv}${stats ? ` (${stats})` : ""}${h.status ? ` · ${h.status}` : ""}`;
  }
  return JSON.stringify(value);
}

/** The field a link from the search results points at: the estimate of the test with that natural key, else any of its fields. */
export function focusedField(fields: ExtractedField[], focusKey: string | undefined): ExtractedField | undefined {
  if (!focusKey) return undefined;
  return (
    fields.find((f) => f.natural_key === `${focusKey}:estimate`) ??
    fields.find((f) => f.natural_key === focusKey || f.natural_key.startsWith(`${focusKey}:`))
  );
}

export function EvidenceWorkspace({ paperId, fields, focusKey }: { paperId: string; fields: ExtractedField[]; focusKey?: string }) {
  const firstWithPage = focusedField(fields, focusKey) ?? fields.find((f) => f.pdf_page_index !== null);
  const [selectedId, setSelectedId] = useState<string | null>(firstWithPage?.id ?? null);
  const selected = fields.find((f) => f.id === selectedId) ?? null;
  const page = selected?.pdf_page_index != null ? selected.pdf_page_index + 1 : 1;

  // The browser's PDF viewer opens the page given in the URL fragment (#page=N).
  // A new `key` per page forces the iframe to reload when only the fragment changes.
  const pdfUrl = `/api/papers/${paperId}/pdf#page=${page}`;

  return (
    <div className="workspace">
      <section className="fields" aria-label="Dữ liệu trích xuất">
        {fields.length === 0 && <p className="muted">Bài này chưa có trường nào hiển thị được.</p>}
        {fields.map((field) => (
          <button
            key={field.id}
            type="button"
            className="field"
            aria-pressed={field.id === selectedId}
            data-testid={`field-${field.natural_key}`}
            onClick={() => setSelectedId(field.id)}
          >
            <div className="field-head">
              <span>{field.field_name}</span>
              <span className={`badge badge-${field.badge}`}>{BADGE_LABEL[field.badge]}</span>
            </div>
            <div className="field-value">{formatValue(field.value)}</div>
            {field.evidence_quote && <div className="field-quote">“{field.evidence_quote}”</div>}
            <div className="muted">
              {field.pdf_page_index !== null
                ? `Trang in ${field.printed_page ?? "?"} · trang ${field.pdf_page_index + 1} của file PDF`
                : "Không có trang bằng chứng"}
            </div>
            {field.id === selectedId && field.check_results.checks && (
              <ul className="checks" aria-label="Vì sao có huy hiệu này">
                {field.check_results.checks.map((check) => (
                  <li key={check.name}>
                    {check.passed ? "✓" : "✗"} {check.detail}
                  </li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </section>

      <section className="pdf-pane" aria-label="PDF gốc">
        <div className="pdf-toolbar" data-testid="pdf-page">
          Đang mở trang {page} của file PDF
          {selected?.printed_page ? ` (trang in ${selected.printed_page})` : ""}
        </div>
        <iframe key={page} className="pdf-frame" src={pdfUrl} title="PDF gốc" data-testid="pdf-frame" />
      </section>
    </div>
  );
}
