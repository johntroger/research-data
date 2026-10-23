"use client";

import Link from "next/link";
import { useState } from "react";
import type { PathLine } from "@/lib/matrix";
import { STATUS_LABEL } from "@/lib/relations";

interface Study {
  studyId: string;
  label: string;
  lines: PathLine[];
}

/** "Xem kiểm định theo Study": the tests of one paper, fetched the first time the row is opened so the matrix page itself stays light. */
export function PaperLines({ paperId, count }: { paperId: string; count: number }) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; studies: Study[] }>({ status: "idle", studies: [] });

  async function load() {
    setState({ status: "loading", studies: [] });
    try {
      const response = await fetch(`/api/matrix/${paperId}`);
      if (!response.ok) throw new Error(String(response.status));
      setState({ status: "ready", studies: ((await response.json()) as { studies: Study[] }).studies });
    } catch {
      setState({ status: "error", studies: [] });
    }
  }

  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open && (state.status === "idle" || state.status === "error")) void load();
      }}
    >
      <summary>Xem kiểm định theo Study ({count})</summary>
      {state.status === "loading" && <p className="muted">Đang tải…</p>}
      {state.status === "error" && <p className="muted">Không tải được. Đóng rồi mở lại để thử lại.</p>}
      {state.studies.map((s) => (
        <div key={s.studyId} className="matrix-study">
          <strong>{s.label}</strong>
          <table className="matrix-lines">
            <thead>
              <tr>
                <th>Giả thuyết</th>
                <th>Quan hệ</th>
                <th>Thống kê</th>
                <th>Trạng thái</th>
                <th>Trang</th>
              </tr>
            </thead>
            <tbody>
              {s.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.hypothesis ?? ""}</td>
                  <td>{l.relation}</td>
                  <td>
                    {l.statistic}
                    {l.r2 && <div className="muted">{l.r2}</div>}
                  </td>
                  <td>
                    {STATUS_LABEL[l.status]}
                    {!l.verified && <span className="badge badge-needs_attention"> ⚠</span>}
                  </td>
                  <td>
                    <Link href={`/papers/${paperId}?focus=${encodeURIComponent(l.naturalKey)}`}>{l.printedPage ? `tr. ${l.printedPage}` : "mở"}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </details>
  );
}
