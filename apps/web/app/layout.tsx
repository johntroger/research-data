import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getLatestRelease } from "@/lib/data";
import { releaseDate, releaseLabel } from "@/lib/release";
import { getOwner } from "@/lib/supabase-server";
import { indexingAllowed } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
  title: "Research Data",
  description: "Công cụ tham khảo: dữ liệu trích xuất từ bài báo khoa học, kèm bằng chứng trong PDF gốc.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [owner, release] = await Promise.all([getOwner(), getLatestRelease()]);
  return (
    <html lang="vi">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            Research Data
          </a>
          <nav className="site-nav">
            <a href="/">Tìm theo quan hệ</a>
            <a href="/library">Thư viện</a>
            <a href="/matrix">Ma trận</a>
            <a href="/concepts">Khái niệm</a>
            <a href="/about">Giới thiệu</a>
          </nav>
          <div className="header-right">
            {owner ? (
              <a href="/admin/quality" className="admin-link">
                Chất lượng (quản trị)
              </a>
            ) : null}
            {owner?.via === "session" ? (
              <form method="post" action="/auth/logout" className="session-box" data-testid="session-box">
                <span className="muted" data-testid="session-email">
                  {owner.email}
                </span>
                <button type="submit" data-testid="logout">
                  Đăng xuất
                </button>
              </form>
            ) : null}
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Dữ liệu do AI trích xuất, chỉ để tham khảo. Người dùng có trách nhiệm đối chiếu với bài gốc trước khi sử dụng
          trong nghiên cứu. Ai cũng dùng được, không cần đăng nhập.
          {release ? (
            <span data-testid="data-release">
              {" "}
              Dữ liệu {releaseLabel(release)} ({releaseDate(release)}).{" "}
              <a href="/about#cach-trich-dan">Cách trích dẫn</a>.
            </span>
          ) : null}
          {!owner ? (
            <>
              {" "}
              <a href="/login" className="login-link" data-testid="login-link">
                Chủ dự án: đăng nhập
              </a>
            </>
          ) : null}
        </footer>
        {/* Page views without cookies, only when a Cloudflare Web Analytics token is configured, and not for the owner's own visits. */}
        {!owner && process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? (
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })} />
        ) : null}
      </body>
    </html>
  );
}
