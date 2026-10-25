import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/app/library/copy-button";
import { CorpusBlock } from "@/app/corpus-block";
import { describeCorpus } from "@/lib/corpus";
import { listConcepts, listLibraryItems, listPathRows } from "@/lib/data";
import { countUse } from "@/lib/usage";
import { academicSentence } from "@/lib/sentence";
import {
  countsLine,
  DEFAULT_QUERY,
  EFFECT_LABEL,
  formatStats,
  hasQuestion,
  isSingleConcept,
  rolesInTest,
  singleTerm,
  paperLabel,
  parseQuery,
  type PathRow,
  queryTitle,
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

/** The tab says what was asked ("ethicality → trust · Research Data"); the bare home page keeps the site name. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const title = queryTitle(parseQuery(await searchParams));
  return title ? { title } : {};
}

function TestLine({ row, concepts, roles = [] }: { row: PathRow; concepts: Map<string, string>; roles?: string[] }) {
  const iv = concepts.get(row.iv_construct_id ?? "");
  const dv = concepts.get(row.dv_construct_id ?? "");
  const stats = formatStats(row);
  const sentence = academicSentence(row);
  return (
    <li data-testid={`test-${row.id}`} className="relation-row">
      <Link href={`/papers/${row.paper_id}?focus=${encodeURIComponent(row.natural_key)}`}>
        {row.studies?.study_label ?? "?"} {row.hypothesis_code ? `· ${row.hypothesis_code} ` : ""}· {row.iv_label_original} → {row.dv_label_original}
      </Link>{" "}
      <span className="stats">{stats}</span> <span>{STATUS_LABEL[row.status]}</span>{" "}
      <span className={`badge badge-${row.badge}`}>{BADGE[row.badge] ?? row.badge}</span>
      {sentence && (
        <>
          {" "}
          <CopyButton text={sentence} label="Copy câu" testId="copy-sentence" track="copy_sentence" />
        </>
      )}
      <div className="muted">
        {roles.length ? `khái niệm tìm là ${roles.join(", ")} · ` : ""}
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
  const [rows, concepts, items] = await Promise.all([listPathRows(), listConcepts(), listLibraryItems()]);
  const corpus = describeCorpus(items);
  const names = suggestions(rows, concepts);
  const conceptName = new Map(concepts.map((c) => [c.id, c.canonical_name]));
  const result = hasQuestion(query) ? searchRelations(rows, concepts, query) : null;
  if (result) await countUse("relation_search");
  const s = result?.summary;
  // The extra filters stay folded until one of them is in use, so a shared link never hides a filter that is shaping its result.
  const filtersActive = query.role !== DEFAULT_QUERY.role || query.status.length > 0 || query.sign.length > 0 || query.includeWarn || query.equiv !== DEFAULT_QUERY.equiv;

  return (
    <>
      <h1>Mối quan hệ giữa hai biến đã được nghiên cứu thế nào?</h1>
      <p className="muted open-note" data-testid="open-note">
        Mở cho mọi người, không cần tài khoản hay đăng nhập: tìm, lọc, xem bằng chứng và xuất bảng đều dùng tự do.
      </p>
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
        <details className="more-filters" open={filtersActive} data-testid="more-filters">
          <summary>Lọc thêm: vai trò quan hệ, kết quả giả thuyết, chiều tác động{filtersActive ? " (đang áp dụng)" : ""}</summary>
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
          <legend>Kết quả và chiều tác động</legend>
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
        </details>
      </form>

      {!result && (
        <section data-testid="samples">
          <details className="quick-guide" open data-testid="quick-guide">
            <summary>Hướng dẫn nhanh: 3 việc làm được ở đây</summary>
            <ol>
              <li>
                <strong>Tìm một mối quan hệ.</strong> Gõ biến A và biến B (tên tiếng Anh bất kỳ trong bài), bấm “Tìm kiếm”. Thanh tổng hợp cho biết bao nhiêu bài, bao nhiêu kiểm định ủng hộ hay không.
              </li>
              <li>
                <strong>Mở bằng chứng trong PDF.</strong> Bấm một kiểm định trong danh sách: bài mở ra đúng trang, có khung tô chỗ bằng chứng. Hãy đối chiếu trước khi dùng số.
              </li>
              <li>
                <strong>Lấy bảng và câu dùng được.</strong> “Tải Excel” hoặc “Tải Word APA 7” xuất đúng danh sách đang xem; “Copy câu” chép một câu kết quả kèm trích dẫn (chỉ kiểm định ✓).
              </li>
            </ol>
            <p className="muted">
              Muốn hiểu các huy hiệu ✓ ⚠ ◇ và độ chính xác đã đo? Xem <Link href="/about">Giới thiệu và cách đọc dữ liệu</Link>.
            </p>
          </details>
          <p className="muted">Nhập một biến để xem mọi quan hệ của nó, hoặc hai biến để xem quan hệ giữa chúng (tên bất kỳ trong bài, tiếng Anh, không phân biệt hoa thường), hoặc thử:</p>
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
          <CorpusBlock corpus={corpus} open />
        </section>
      )}

      {result && s && (
        <>
          <section className="summary" data-testid="summary">
            {isSingleConcept(query) && (
              <p data-testid="single-note">
                <strong>Tìm theo một khái niệm:</strong> mọi quan hệ có “{singleTerm(query)}” là biến độc lập, biến phụ thuộc, trung gian hoặc điều tiết, theo cả hai chiều và mọi vai trò (không gồm biến kiểm soát); không phân biệt chữ hoa, chữ thường. Ô “Chiều” và “Vai trò” không áp dụng. Nhập thêm khái niệm thứ hai để xem riêng quan hệ giữa hai khái niệm.
              </p>
            )}
            {s.tests === 0 && s.notCounted > 0 ? (
              // Tests exist but none is ✓ / ★: say so, instead of "0 bài" and a row of zeros.
              <p data-testid="summary-counts">
                <strong>Chưa có kiểm định nào đã kiểm chứng (✓)</strong>
              </p>
            ) : (
              <p data-testid="summary-counts">
                <strong>{countsLine(s, query.includeWarn)}</strong>
              </p>
            )}
            {s.relations < s.tests && (
              <p className="muted" data-testid="summary-distinct">
                {s.tests} kiểm định này chỉ gồm <strong>{s.relations} quan hệ khác nhau</strong>: cùng một quan hệ trong cùng study có thể được báo cáo ở nhiều mô hình hoặc bảng và được đếm nhiều lần (các dòng có hậu tố “#2”, “#3” ở khóa kiểm định).
              </p>
            )}
            <p className="muted" data-testid="summary-coverage">
              Tìm thấy <strong>{s.matchedTests} kiểm định từ {s.matchedPapers} bài</strong> (kho có {s.corpusPapers} bài có dữ liệu quan hệ, chọn theo thư viện của chủ dự án, không phải mẫu hệ thống của y văn).
            </p>
            <CorpusBlock corpus={corpus} />
            {!(s.tests === 0 && s.notCounted > 0) && (
              <>
                <p className="muted" data-testid="summary-method">Phương pháp: đếm số kiểm định theo kết quả (vote counting). Không xét cỡ mẫu, cỡ hiệu ứng hay sức mạnh thống kê; không phải meta-analysis.</p>
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
                      <TestLine key={r.id} row={r} concepts={conceptName} roles={rolesInTest(r, concepts, query)} />
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
