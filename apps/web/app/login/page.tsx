import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { getOwner } from "@/lib/supabase-server";
import { requestLink } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("login.title") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { t } = await getT();
  const params = await searchParams;
  const sent = params.sent === "1";
  const errorKey = typeof params.error === "string" && ["empty", "wait", "denied"].includes(params.error) ? (params.error as "empty" | "wait" | "denied") : null;
  const owner = await getOwner();

  return (
    <>
      <h1>{t("login.h1")}</h1>
      <p className="muted">{t("login.intro")}</p>
      {owner?.via === "session" ? (
        <p data-testid="login-already">
          {t("login.already", { email: owner.email ?? "" })} <Link href="/">{t("login.home")}</Link>
        </p>
      ) : (
        <form action={requestLink} className="login-form" data-testid="login-form">
          <label>
            {t("login.email")}{" "}
            <input type="email" name="email" required autoComplete="email" maxLength={254} placeholder={t("login.placeholder")} />
          </label>{" "}
          <button type="submit">{t("login.send")}</button>
        </form>
      )}
      {sent && (
        <p className="login-note" role="status" data-testid="login-sent">
          {t("login.sent.before")}
          <strong>{t("login.sent.strong")}</strong>.
        </p>
      )}
      {errorKey && (
        <p className="login-note login-error" role="alert" data-testid="login-error">
          {t(`login.error.${errorKey}`)}
        </p>
      )}
    </>
  );
}
