"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/app/i18n-provider";
import type { PathLine } from "@/lib/matrix";

interface Study {
  studyId: string;
  label: string;
  lines: PathLine[];
}

/** "See tests by Study": the tests of one paper, fetched the first time the row is opened so the matrix page itself stays light. */
export function PaperLines({ paperId, count }: { paperId: string; count: number }) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; studies: Study[] }>({ status: "idle", studies: [] });
  const { t } = useT();

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
      <summary>{t("c.lines.summary", { n: count })}</summary>
      {state.status === "loading" && <p className="muted">{t("c.lines.loading")}</p>}
      {state.status === "error" && <p className="muted">{t("c.lines.error")}</p>}
      {state.studies.map((s) => (
        <div key={s.studyId} className="matrix-study">
          <strong>{s.label}</strong>
          <table className="matrix-lines">
            <thead>
              <tr>
                <th>{t("c.lines.hypothesis")}</th>
                <th>{t("c.lines.relation")}</th>
                <th>{t("c.lines.statistic")}</th>
                <th>{t("c.lines.status")}</th>
                <th>{t("c.lines.page")}</th>
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
                    {t(`c.status.${l.status}`)}
                    {!l.verified && <span className="badge badge-needs_attention"> ⚠</span>}
                  </td>
                  <td>
                    <Link href={`/papers/${paperId}?focus=${encodeURIComponent(l.naturalKey)}`}>{l.printedPage ? t("c.lines.pageShort", { p: l.printedPage }) : t("c.lines.open")}</Link>
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
