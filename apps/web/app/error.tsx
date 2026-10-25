"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useT } from "./i18n-provider";

/**
 * What a visitor sees when a page cannot read its data (database not running, network down), instead of a bare
 * "500". On this machine the usual cause is that Docker Desktop or the local database is not started.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const { t } = useT();
  // The failed page is a server page: it has to be fetched again, then the error is cleared.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <section role="alert" data-testid="load-error">
      <h1>{t("c.error.title")}</h1>
      <p>{t("c.error.1")}</p>
      <p>{t("c.error.2")}</p>
      <ol>
        <li>{t("c.error.step1")}</li>
        <li>
          {t("c.error.step2.before")}
          <code>pnpm db:start</code>.
        </li>
        <li>{t("c.error.step3")}</li>
      </ol>
      <p>
        <button type="button" onClick={retry} data-testid="load-error-retry">
          {t("c.error.retry")}
        </button>{" "}
        <a href="/">{t("c.error.home")}</a>
      </p>
    </section>
  );
}
