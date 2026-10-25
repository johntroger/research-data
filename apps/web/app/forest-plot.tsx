import { type Forest, forestRange } from "@/lib/forest";
import { ESTIMATE_LABEL } from "@/lib/relations";

/** A forest plot as plain SVG: one line per study, the estimate as a square, the interval as a whisker, zero as a dashed line. */
export function ForestPlot({ forest }: { forest: Forest }) {
  const { min, max } = forestRange(forest.points);
  const rowH = 24;
  const left = 260;
  const width = 700;
  const plotW = width - left - 20;
  const height = forest.points.length * rowH + 40;
  const x = (v: number) => left + ((v - min) / (max - min)) * plotW;
  return (
    <figure className="forest" data-testid="forest-plot">
      <figcaption>
        <strong>Biểu đồ rừng</strong> ({ESTIMATE_LABEL[forest.kind]}, {forest.points.length} study có khoảng tin cậy hoặc sai số chuẩn). Đây là hình các study báo cáo, không phải meta-analysis: không có ước lượng gộp.
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Biểu đồ rừng của ${forest.points.length} study`}>
        <line x1={x(0)} x2={x(0)} y1={8} y2={height - 28} stroke="currentColor" strokeDasharray="4 3" opacity={0.5} />
        {forest.points.map((p, i) => {
          const y = 20 + i * rowH;
          return (
            <g key={p.id}>
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize={12} fill="currentColor">
                {p.label.length > 38 ? `${p.label.slice(0, 37)}…` : p.label}
              </text>
              <line x1={x(p.low)} x2={x(p.high)} y1={y} y2={y} stroke="currentColor" strokeWidth={1.5} strokeDasharray={p.fromSe ? "3 2" : undefined} />
              <rect x={x(p.estimate) - 4} y={y - 4} width={8} height={8} fill="currentColor" />
            </g>
          );
        })}
        {[min, 0, max].map((t) => (
          <text key={t} x={x(t)} y={height - 8} textAnchor="middle" fontSize={11} fill="currentColor">
            {t === 0 ? "0" : t.toFixed(1)}
          </text>
        ))}
      </svg>
      <p className="muted">Đường đứt: khoảng tính từ sai số chuẩn (ước lượng ± 1,96 SE) vì bài không in khoảng tin cậy.</p>
    </figure>
  );
}
