import Link from "next/link";
import { listConcepts, listPathRows } from "@/lib/data";
import {
  DEFAULT_QUERY,
  EFFECT_LABEL,
  formatEstimate,
  formatP,
  hasQuestion,
  paperLabel,
  parseQuery,
  type PathRow,
  queryToSearch,
  type RelationQuery,
  SAMPLE_QUERIES,
  searchRelations,
  STATUS_LABEL,
  suggestions,
} from "@/lib/relations";

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  auto_verified: "✓ đã kiểm chứng",
  needs_attention: "⚠ nên xem kỹ",
  ai_interpreted: "◇ AI diễn giải",
  human_reviewed: "★ đã sửa",
  disputed: "⚑ có báo lỗi",
};

const DESIGN: Record<string, string> = {
  survey: "khảo sát",
  lab_experiment: "thực nghiệm phòng lab",
  online_experiment: "thực nghiệm online",
  field_experiment: "thực nghiệm thực địa",
  secondary_data: "dữ liệu thứ cấp",
  longitudinal_panel: "panel dọc",
  qualitative: "định tính",
  other: "khác",
};

const OUTCOME: { key: "supported" | "not_supported" | "mixed" | "not_hypothesized"; label: string }[] = [
  { key: "supported", label: "✓ Ủng hộ" },
  { key: "not_supported", label: "✗ Không ủng hộ" },
  { key: "mixed", label: "◐ Một phần / Trộn" },
  { key: "not_hypothesized", label: "○ Không đặt giả thuyết" },
];

const link = (q: RelationQuery) => `/?${queryToSearch(q)}`;

function TestLine({ row, concepts }: { row: PathRow; concepts: Map<string, string> }) {
  const iv = concepts.get(row.iv_construct_id ?? "");
  const dv = concepts.get(row.dv_construct_id ?? "");
  const stats = [formatEstimate(row), formatP(row)].filter(Boolean).join("  ");
  return (
    <li data-testid={`test-${row.id}`} className="relation-row">
      <Link href={`/papers/${row.paper_id}?focus=${encodeURIComponent(row.natural_key)}`}>
        {row.studies?.study_label ?? "?"} {row.hypothesis_code ? `· ${row.hypothesis_code} ` : ""}· {row.iv_label_original} → {row.dv_label_original}
      </Link>{" "}
      <span className="stats">{stats}</span> <span>{STATUS_LABEL[row.status]}</span>{" "}
      <span className={`badge badge-${row.badge}`}>{BADGE[row.badge] ?? row.badge}</span>
      <div className="muted">
        {EFFECT_LABEL[row.effect_type]}
        {row.mediator_labels.length ? ` · qua trung gian: ${row.mediator_labels.join(", ")}` : ""}
        {row.moderator_labels.length ? ` · điều tiết bởi: ${row.moderator_labels.join(", ")}` : ""}
        {iv && iv !== row.iv_label_original ? ` · khái niệm chuẩn (biến độc lập): ${iv}` : ""}
        {dv && dv !== row.dv_label_original ? ` · khái niệm chuẩn (biến phụ thuộc): ${dv}` : ""}
        {row.evidence ? ` · trang in ${row.evidence.printed_page ?? "?"} (trang ${row.evidence.pdf_page_index + 1} của file PDF)` : ""}
      </div>
    </li>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = parseQuery(await searchParams);
  const [rows, concepts] = await Promise.all([listPathRows(), listConcepts()]);
  const names = suggestions(rows, concepts);
  const conceptName = new Map(concepts.map((c) => [c.id, c.canonical_name]));
  const result = hasQuestion(query) ? searchRelations(rows, concepts, query) : null;
  const s = result?.summary;

  return (
    <>
      <h1>Mối quan hệ giữa hai biến đã được nghiên cứu thế nào?</h1>
      <form method="get" action="/" className="relation-form" data-testid="relation-form">
        <div className="relation-inputs">
          <label>
            Biến A <input name="a" list="variable-names" defaultValue={query.a} placeholder="ví dụ: ethicality" />
          </label>
          <label>
            Chiều
            <select name="dir" defaultValue={query.dir}>
              <option value="ab">A → B</option>
              <option value="ba">B → A</option>
              <option value="both">⇄ cả hai</option>
            </select>
          </label>
          <label>
            Biến B <input name="b" list="variable-names" defaultValue={query.b} placeholder="ví dụ: trust" />
          </label>
          <button type="submit">Tìm kiếm</button>
        </div>
        <datalist id="variable-names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <fieldset>
          <legend>Vai trò quan hệ</legend>
          {(
            [
              ["direct", "Trực tiếp"],
              ["mediated", "Qua trung gian"],
              ["moderated", "Có điều tiết"],
              ["all", "Tất cả"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="role" value={value} defaultChecked={query.role === value} /> {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Lọc thêm</legend>
          <span className="muted">Kết quả giả thuyết:</span>
          {OUTCOME.map((o) => (
            <label key={o.key}>
              <input type="checkbox" name="status" value={o.key} defaultChecked={query.status.includes(o.key)} /> {o.label}
            </label>
          ))}
          <br />
          <span className="muted">Chiều tác động:</span>
          {(
            [
              ["positive", "＋ Dương"],
              ["negative", "－ Âm"],
              ["none", "∅ Không có ý nghĩa"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input type="checkbox" name="sign" value={value} defaultChecked={query.sign.includes(value)} /> {label}
            </label>
          ))}
        </fieldset>
        <div>
          <input type="hidden" name="equiv" value="0" />
          <label>
            <input type="checkbox" name="equiv" value="1" defaultChecked={query.equiv} /> Bao gồm tên gọi tương đương (khái niệm chuẩn và các tên khác)
          </label>{" "}
          <label>
            <input type="checkbox" name="warn" value="1" defaultChecked={query.includeWarn} /> Tính cả kiểm định ⚠ trong thanh tổng hợp
          </label>
        </div>
      </form>

      {!result && (
        <section data-testid="samples">
          <p className="muted">Nhập một hoặc hai biến (tên bất kỳ trong bài, tiếng Anh), hoặc thử:</p>
          <ul className="sample-list">
            {SAMPLE_QUERIES.map((x) => (
              <li key={`${x.a}-${x.b}`}>
                <Link href={link({ ...DEFAULT_QUERY, ...x })}>
                  {x.a} → {x.b}
                </Link>
              </li>
            ))}
          </ul>
          <p className="muted">Mọi con số là con số trong kho (các bài đã đưa vào hệ thống), không phải của cả lĩnh vực.</p>
        </section>
      )}

      {result && s && (
        <>
          <section className="summary" data-testid="summary">
            {s.tests === 0 && s.notCounted > 0 ? (
              // Tests exist but none is ✓ / ★: say so, instead of "0 bài" and a row of zeros.
              <p data-testid="summary-counts">
                <strong>Chưa có kiểm định nào đã kiểm chứng (✓)</strong>
              </p>
            ) : (
              <>
                <p data-testid="summary-counts">
                  <strong>
                    {s.papers} bài trong kho · {s.studies} study · {s.tests} kiểm định
                  </strong>
                </p>
                <p data-testid="summary-outcome">
                  Kết quả giả thuyết: {OUTCOME.map((o) => `${o.label} ${s.outcome[o.key]}`).join(" · ")}
                </p>
                <p data-testid="summary-direction">
                  Chiều tác động: ＋ Dương {s.direction.positive} · － Âm {s.direction.negative} · ∅ Không có ý nghĩa {s.direction.none}
                  {s.direction.unknown ? ` · ? Không rõ ${s.direction.unknown}` : ""}
                </p>
              </>
            )}
            {s.notCounted > 0 && (
              <p data-testid="summary-not-counted">
                {s.notCounted} kiểm định ⚠ hoặc ◇ chưa kiểm chứng, chưa được tính
                {Object.keys(s.notCountedByDesign).length > 0
                  ? ` (${Object.entries(s.notCountedByDesign)
                      .map(([d, n]) => `${n} thuộc ${DESIGN[d] ?? d}`)
                      .join(", ")})`
                  : ""}
                . <Link href={link({ ...query, includeWarn: true })}>Tính cả ⚠ để xem số liệu sơ bộ</Link>
                {s.shareNotCounted > 0.2 ? " · Kết quả có thể thiên về các nghiên cứu đơn giản." : ""}
              </p>
            )}
            <details>
              <summary>ⓘ Cách đọc kết quả này</summary>
              <ul>
                <li>Đây là thống kê mô tả trong kho, không phải kết luận của cả lĩnh vực và không thay cho meta-analysis.</li>
                <li>Không có ý nghĩa thống kê không có nghĩa là không có tác động.</li>
                <li>Kho chỉ gồm bài đã xuất bản và phản ánh thư viện của chủ dự án, nên tỷ lệ "ủng hộ" có thể cao hơn thực tế.</li>
                <li>Dữ liệu do AI trích xuất, kiểm tra tự động với PDF; hãy bấm vào một kiểm định để xem bằng chứng trong bài gốc.</li>
              </ul>
            </details>
          </section>

          {result.rows.length === 0 ? (
            <section data-testid="empty">
              <p>
                <strong>Chưa có bài nào trong kho kiểm định quan hệ này: có thể là khoảng trống nghiên cứu.</strong> Kho chưa bao phủ toàn bộ tài liệu.
              </p>
              <ul>
                {query.dir !== "both" && (
                  <li>
                    <Link href={link({ ...query, dir: "both" })}>Thử cả hai chiều</Link>
                  </li>
                )}
                {!query.equiv && (
                  <li>
                    <Link href={link({ ...query, equiv: true })}>Bật tên gọi tương đương</Link>
                  </li>
                )}
                {query.role !== "all" && (
                  <li>
                    <Link href={link({ ...query, role: "all" })}>Thử tất cả vai trò</Link>
                  </li>
                )}
              </ul>
            </section>
          ) : (
            <section data-testid="results">
              <p>
                <a href={`/export?${queryToSearch(query)}`} download data-testid="export-excel">
                  Tải Excel ({result.rows.length} kiểm định)
                </a>
                {" · "}
                <a href={`/export/word?${queryToSearch(query)}`} download data-testid="export-word">
                  Tải Word APA 7
                </a>{" "}
                <span className="muted">đúng danh sách bên dưới, có cột huy hiệu, trang in và tuyên bố trách nhiệm.</span>
              </p>
              {result.groups.map((g) => (
                <div key={g.paperId} className="relation-paper" data-testid={`paper-${g.paperId}`}>
                  <h3>
                    <Link href={`/papers/${g.paperId}`}>{paperLabel(g.paper)}</Link>
                    <span className="muted">
                      {g.paper?.journal ? ` · ${g.paper.journal}` : ""}
                      {g.differs ? " · Kết quả khác nhau giữa các study" : ""}
                    </span>
                  </h3>
                  <ul>
                    {g.rows.map((r) => (
                      <TestLine key={r.id} row={r} concepts={conceptName} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
