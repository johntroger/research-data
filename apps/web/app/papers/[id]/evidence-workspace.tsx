"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import type { ExtractedField } from "@/lib/data";
import { fieldLabel, groupBadge, groupFields, testSummary, valueLabel } from "@/lib/field-labels";
import { readableKey } from "@/lib/paper-header";
import { trackUse } from "@/lib/track";
import { PdfViewer } from "./pdf-viewer";
import {
  clampSplit,
  defaultTab,
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
    return [t.table_label, t.kind === "other" ? null : t.kind, t.study_label].filter(Boolean).join(" · ");
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
function Why({ paperId, field, page, canView }: { paperId: string; field: ExtractedField; page: number; canView: boolean }) {
  const checks = field.check_results.checks ?? [];
  const failed = checks.filter((c) => !c.passed);
  const passed = checks.filter((c) => c.passed);
  return (
    <section className="why" data-testid={`why-${field.natural_key}`} aria-label="Vì sao có huy hiệu này">
      <h3>Vì sao {BADGE_LABEL[field.badge]}</h3>
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
      {canView && field.pdf_page_index !== null && (
        <a href={`/api/papers/${paperId}/pdf#page=${page}`} target="_blank" rel="noreferrer">
          Mở trong PDF (trang {page})
        </a>
      )}
    </section>
  );
}

/** What a visitor may do with the PDF (step 2.2c): view it here, or only follow the links to the paper's own copy. */
export interface PdfAccess {
  canView: boolean;
  oaUrl: string | null;
  doiUrl: string | null;
}

export function EvidenceWorkspace({ paperId, fields, focusKey, canDownload = false, access = { canView: true, oaUrl: null, doiUrl: null } }: { paperId: string; fields: ExtractedField[]; focusKey?: string; canDownload?: boolean; access?: PdfAccess }) {
  const summary = summariseSections(fields);
  const start = focusedField(fields, focusKey) ?? fields.find((f) => f.pdf_page_index !== null && tabOf(f) === defaultTab(summary)) ?? fields.find((f) => f.pdf_page_index !== null);
  const [selectedId, setSelectedId] = useState<string | null>(start?.id ?? null);
  // Counts clicks on values, so clicking the selected one again brings the PDF back to its page.
  const [visit, setVisit] = useState(0);
  const [tab, setTab] = useState<TabId>(start ? tabOf(start) : defaultTab(summary));
  const [split, setSplit] = useState(SPLIT_DEFAULT);
  const [dragging, setDragging] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const pdfPane = useRef<HTMLElement>(null);

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
        <h2 className="sr-only">Dữ liệu trích xuất</h2>
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
          {groupFields(inTab).map((group) => {
            const renderField = (field: ExtractedField, previous: ExtractedField | undefined) => {
              // Inside a group the heading already says which test, construct or cell it is, and fields of one test usually share one quote and page.
              const grouped = previous !== undefined || group.context !== null;
              const sameEvidence = previous !== undefined && previous.evidence_quote === field.evidence_quote && previous.pdf_page_index === field.pdf_page_index && previous.printed_page === field.printed_page;
              return (
                <div key={field.id}>
                  <button
                    type="button"
                    className="field"
                    aria-pressed={field.id === selectedId}
                    data-testid={`field-${field.natural_key}`}
                    onClick={() => {
                      trackUse("evidence_open");
                      setSelectedId(field.id);
                      setVisit((v) => v + 1);
                      // On a narrow screen the PDF sits below the values (the panes are stacked): bring it into view.
                      if (window.matchMedia("(max-width: 900px)").matches) pdfPane.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {(() => {
                      const shown = valueLabel(field.field_name, field.value) ?? formatValue(field.value);
                      // In a group a short value sits on the label's line, and a ✓ is left to the group's heading (a screen reader still hears it).
                      const inline = group.context !== null && shown.length <= 40;
                      const quiet = group.context !== null && field.badge === "auto_verified";
                      const badge = <span className={`badge badge-${field.badge}${quiet ? " sr-only" : ""}`}>{BADGE_LABEL[field.badge]}</span>;
                      return (
                        <>
                          <div className={`field-head${inline ? " field-head-inline" : ""}`}>
                            <span>{fieldLabel(field.field_name)}</span>
                            {inline && <span className="field-value">{shown}</span>}
                            {badge}
                          </div>
                          {!grouped && <div className="field-key muted">{readableKey(keyContext(field.natural_key, field.field_name))}</div>}
                          {!inline && <div className="field-value">{shown}</div>}
                        </>
                      );
                    })()}
                    {field.evidence_quote && !sameEvidence && <div className="field-quote">“{field.evidence_quote}”</div>}
                    {!sameEvidence && (
                      <div className="muted">
                        {field.pdf_page_index !== null
                          ? `Trang in ${field.printed_page ?? "?"} · trang ${field.pdf_page_index + 1} của file PDF`
                          : "Không có trang bằng chứng"}
                      </div>
                    )}
                  </button>
                  {field.id === selectedId && <Why paperId={paperId} field={field} page={page} canView={access.canView} />}
                </div>
              );
            };
            if (group.context === null) return renderField(group.fields[0]!, undefined);
            const summaryLine = testSummary(group.fields);
            const badge = groupBadge(group.fields) as ExtractedField["badge"];
            return (
              <section key={group.context} className="test-group" data-testid={`group-${group.context}`} aria-label={readableKey(group.context)}>
                <header className="test-group-head">
                  <div className="test-group-title">
                    <strong>{readableKey(group.context)}</strong>
                    <span className={`badge badge-${badge}`}>{BADGE_LABEL[badge]}</span>
                  </div>
                  {summaryLine && <div className="test-group-summary">{summaryLine}</div>}
                </header>
                {group.fields.map((field, i) => renderField(field, group.fields[i - 1]))}
              </section>
            );
          })}
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

      <section ref={pdfPane} className="pdf-pane" aria-label="PDF gốc">
        {access.canView ? (
          <PdfViewer
            paperId={paperId}
            page={page}
            printedPage={selected?.printed_page ?? null}
            highlight={selected?.highlight ?? null}
            hasQuote={Boolean(selected?.evidence_quote) && selected?.pdf_page_index != null}
            canDownload={canDownload}
            fieldKey={selected ? `${selected.id}:${visit}` : null}
          />
        ) : (
          <div className="pdf-restricted" data-testid="pdf-restricted">
            <p>
              <strong>PDF của bài này không được đăng công khai.</strong> Bài không có giấy phép mở, nên web chỉ hiện dữ liệu trích xuất và câu trích kèm số trang để bạn đối chiếu với bản gốc.
            </p>
            <p>
              {access.oaUrl && (
                <a href={access.oaUrl} target="_blank" rel="noreferrer" data-testid="link-oa">
                  Bản OA (nhà xuất bản hoặc kho lưu trữ)
                </a>
              )}
              {access.oaUrl && access.doiUrl && " · "}
              {access.doiUrl && (
                <a href={access.doiUrl} target="_blank" rel="noreferrer" data-testid="link-doi">
                  Mở DOI
                </a>
              )}
              {!access.oaUrl && !access.doiUrl && <span className="muted">Chưa có liên kết tới bản gốc.</span>}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
