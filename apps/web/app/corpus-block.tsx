import Link from "next/link";
import { type CorpusSummary, RECENT_FROM } from "@/lib/corpus";
import type { Translate, TranslatePlural } from "@/lib/i18n";
import { label, type LabelGroup } from "@/lib/labels";

export function CorpusBlock({ corpus, t, tn, open = false }: { corpus: CorpusSummary; t: Translate; tn: TranslatePlural; open?: boolean }) {
  const parts = (group: LabelGroup, xs: { key: string; n: number }[], limit = 4) => xs.slice(0, limit).map((x) => `${label(t, group, x.key)} ${x.n}`).join(" · ");
  return (
    <details className="corpus-block" open={open} data-testid="corpus">
      <summary>
        {t("corpus.summary", { papers: tn("n.papers", corpus.papers) })}
        {corpus.yearMin !== null ? t("corpus.years", { min: corpus.yearMin, max: corpus.yearMax ?? "" }) : ""}
      </summary>
      <ul>
        <li data-testid="corpus-years">
          {t("corpus.recent", { recent: corpus.recent, from: RECENT_FROM, before: corpus.papers - corpus.recent - corpus.noYear })}
          {corpus.noYear > 0 ? t("corpus.noYear", { n: corpus.noYear }) : ""}.
        </li>
        {corpus.types.length > 0 && <li>{t("corpus.types", { list: parts("ptype", corpus.types) })}</li>}
        {corpus.designs.length > 0 && <li>{t("corpus.designs", { list: parts("design", corpus.designs, 5) })}</li>}
        {corpus.samples.length > 0 && <li>{t("corpus.samples", { list: parts("sample", corpus.samples, 5), countries: corpus.countries })}</li>}
        <li data-testid="corpus-caveat">
          <strong>{t("corpus.caveat.lead")}</strong>
          {t("corpus.caveat.rest")}
        </li>
      </ul>
      <p className="muted">
        {t("corpus.more.before")}
        <Link href="/library">{t("corpus.more.link")}</Link>
        {t("corpus.more.after")}
      </p>
    </details>
  );
}
