import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getLatestRelease } from "@/lib/data";
import { clientMessages } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { releaseDate, releaseLabel } from "@/lib/release";
import { getOwner } from "@/lib/supabase-server";
import { indexingAllowed } from "@/lib/seo";
import { I18nProvider } from "./i18n-provider";
import { LangSwitch } from "./lang-switch";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
    title: "Research Data",
    description: t("app.description"),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [owner, release, { lang, t }] = await Promise.all([getOwner(), getLatestRelease(), getT()]);
  return (
    <html lang={lang}>
      <body>
        <I18nProvider lang={lang} messages={clientMessages(lang)}>
          <header className="site-header">
            <a href="/" className="brand">
              Research Data
            </a>
            <nav className="site-nav">
              <a href="/">{t("nav.search")}</a>
              <a href="/library">{t("nav.library")}</a>
              <a href="/matrix">{t("nav.matrix")}</a>
              <a href="/concepts">{t("nav.concepts")}</a>
              <a href="/map">{t("nav.map")}</a>
              <a href="/about">{t("nav.about")}</a>
            </nav>
            <div className="header-right">
              <LangSwitch lang={lang} />
              {owner ? (
                <a href="/admin/quality" className="admin-link">
                  {t("header.admin")}
                </a>
              ) : null}
              {owner?.via === "session" ? (
                <form method="post" action="/auth/logout" className="session-box" data-testid="session-box">
                  <span className="muted" data-testid="session-email">
                    {owner.email}
                  </span>
                  <button type="submit" data-testid="logout">
                    {t("header.logout")}
                  </button>
                </form>
              ) : null}
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            {t("footer.disclaimer")}
            {release ? (
              <span data-testid="data-release">
                {" "}
                {t("footer.release", { label: releaseLabel(release, lang), date: releaseDate(release, lang) })}{" "}
                <a href="/about#cach-trich-dan">{t("footer.cite")}</a>.
              </span>
            ) : null}
            {!owner ? (
              <>
                {" "}
                <a href="/login" className="login-link" data-testid="login-link">
                  {t("footer.login")}
                </a>
              </>
            ) : null}
          </footer>
        </I18nProvider>
        {/* Page views without cookies, only when a Cloudflare Web Analytics token is configured, and not for the owner's own visits. */}
        {!owner && process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? (
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })} />
        ) : null}
      </body>
    </html>
  );
}
