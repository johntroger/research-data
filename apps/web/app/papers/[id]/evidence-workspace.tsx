"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import type { ExtractedField } from "@/lib/data";
import { PdfViewer } from "./pdf-viewer";
import {
  clampSplit,
  firstTabWithFields,
  keyContext,
  parseStoredSplit,
  sectionBadge,
  SPLIT_DEFAULT,
  SPLIT_MAX,
  SPLIT_MIN,
  SPLIT_STEP,
  SPLIT_STORAGE_KEY,
  splitFromPointer,
  summariseSections,
  TABS,
  tabOf,
  type TabId,
} from "@/lib/workspace";

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
  if (typeof value === "object" && "table_label" in value) {
    const t = value as { table_label: string; kind?: string; study_label?: string | null };
    return [t.table_label, t.kind, t.study_label].filter(Boolean).join(" · ");
  }
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

/** The small table "why this badge": the checks that passed and the ones that did not (Mục 8.3). */
function Why({ paperId, field, page }: { paperId: string; field: ExtractedField; page: number }) {
  const checks = field.check_results.checks ?? [];
  const failed = checks.filter((c) => !c.passed);
  const passed = checks.filter((c) => c.passed);
  return (
    <section className="why" data-testid={`why-${field.natural_key}`} aria-label="Vì sao có huy hiệu này">
      <h4>Vì sao {BADGE_LABEL[field.badge]}</h4>
      {checks.length === 0 ? (
        <p className="muted">
          {field.badge === "ai_interpreted"
            ? "Trường diễn giải: AI tự diễn giải từ bài, máy không kiểm tra được. Hãy đối chiếu với câu trích và trang PDF."
            : "Chưa có kiểm tra nào được ghi cho trường này."}
        </p>
      ) : (
        <ul className="checks">
          {[...failed, ...passed].map((check) => (
            <li key={check.name} className={check.passed ? "check-pass" : "check-fail"}>
              {check.passed ? "✓" : "✗ chưa qua:"} {check.detail}
            </li>
          ))}
        </ul>
      )}
      {field.pdf_page_index !== null && (
        <a href={`/api/papers/${paperId}/pdf#page=${page}`} target="_blank" rel="noreferrer">
          Mở trong PDF (trang {page})
        </a>
      )}
    </section>
  );
}

export function EvidenceWorkspace({ paperId, fields, focusKey }: { paperId: string; fields: ExtractedField[]; focusKey?: string }) {
  const summary = summariseSections(fields);
  const start = focusedField(fields, focusKey) ?? fields.find((f) => f.pdf_page_index !== null && tabOf(f) === firstTabWithFields(summary)) ?? fields.find((f) => f.pdf_page_index !== null);
  const [selectedId, setSelectedId] = useState<string | null>(start?.id ?? null);
  // Counts clicks on values, so clicking the selected one again brings the PDF back to its page.
  const [visit, setVisit] = useState(0);
  const [tab, setTab] = useState<TabId>(start ? tabOf(start) : firstTabWithFields(summary));
  const [split, setSplit] = useState(SPLIT_DEFAULT);
  const [dragging, setDragging] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // The remembered width is read after the first render, so the server and the browser draw the same page first.
  useEffect(() => {
    try {
      setSplit(parseStoredSplit(window.localStorage.getItem(SPLIT_STORAGE_KEY)));
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);

  const remember = (percent: number) => {
    try {
      window.localStorage.setItem(SPLIT_STORAGE_KEY, String(percent));
    } catch {
      /* storage blocked: the width just is not remembered */
    }
  };

  const selected = fields.find((f) => f.id === selectedId) ?? null;
  const page = selected?.pdf_page_index != null ? selected.pdf_page_index + 1 : 1;
  const inTab = fields.filter((f) => tabOf(f) === tab);

  const openTab = (id: TabId) => {
    setTab(id);
    if (!selected || tabOf(selected) !== id) setSelectedId(fields.find((f) => tabOf(f) === id && f.pdf_page_index !== null)?.id ?? fields.find((f) => tabOf(f) === id)?.id ?? selectedId);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !container.current) return;
    const rect = container.current.getBoundingClientRect();
    setSplit(splitFromPointer(e.clientX, rect.left, rect.width));
  };
  const onPointerUp = () => {
    setDragging(false);
    remember(split);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = e.key === "ArrowLeft" ? split - SPLIT_STEP : e.key === "ArrowRight" ? split + SPLIT_STEP : e.key === "Home" ? SPLIT_MIN : e.key === "End" ? SPLIT_MAX : null;
    if (next === null) return;
    e.preventDefault();
    const value = clampSplit(next);
    setSplit(value);
    remember(value);
  };

  return (
    <div ref={container} className={`workspace${dragging ? " dragging" : ""}`} style={{ ["--left" as string]: `${split}%` }}>
      <section className="fields-pane" aria-label="Dữ liệu trích xuất">
        <div role="tablist" aria-label="Phần của bài" className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === tab}
              aria-controls="fields-panel"
              className="tab"
              data-testid={`tab-${t.id}`}
              onClick={() => openTab(t.id)}
            >
              {t.label} <span className="tab-count">{summary[t.id].total}</span>
            </button>
          ))}
        </div>
        <p className="section-badge" data-testid="section-badge">
          {sectionBadge(TABS.find((t) => t.id === tab)!.label, summary[tab])}
        </p>
        <div role="tabpanel" id="fields-panel" aria-labelledby={`tab-${tab}`} className="fields">
          {inTab.length === 0 && <p className="muted">Phần này chưa có trường nào hiển thị được.</p>}
          {inTab.map((field) => (
            <div key={field.id}>
              <button
                type="button"
                className="field"
                aria-pressed={field.id === selectedId}
                data-testid={`field-${field.natural_key}`}
                onClick={() => {
                  setSelectedId(field.id);
                  setVisit((v) => v + 1);
                }}
              >
                <div className="field-head">
                  <span>{field.field_name}</span>
                  <span className={`badge badge-${field.badge}`}>{BADGE_LABEL[field.badge]}</span>
                </div>
                <div className="field-key muted">{keyContext(field.natural_key, field.field_name)}</div>
                <div className="field-value">{formatValue(field.value)}</div>
                {field.evidence_quote && <div className="field-quote">“{field.evidence_quote}”</div>}
                <div className="muted">
                  {field.pdf_page_index !== null
                    ? `Trang in ${field.printed_page ?? "?"} · trang ${field.pdf_page_index + 1} của file PDF`
                    : "Không có trang bằng chứng"}
                </div>
              </button>
              {field.id === selectedId && <Why paperId={paperId} field={field} page={page} />}
            </div>
          ))}
        </div>
      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để đổi độ rộng hai bên (hoặc dùng phím mũi tên trái / phải)"
        aria-valuenow={split}
        aria-valuemin={SPLIT_MIN}
        aria-valuemax={SPLIT_MAX}
        tabIndex={0}
        className="splitter"
        data-testid="splitter"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />

      <section className="pdf-pane" aria-label="PDF gốc">
        <PdfViewer
          paperId={paperId}
          page={page}
          printedPage={selected?.printed_page ?? null}
          highlight={selected?.highlight ?? null}
          hasQuote={Boolean(selected?.evidence_quote) && selected?.pdf_page_index != null}
          fieldKey={selected ? `${selected.id}:${visit}` : null}
        />
      </section>
    </div>
  );
}
