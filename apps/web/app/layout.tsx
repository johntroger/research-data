import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminDbUrl } from "@/lib/admin-db";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Data",
  description: "Công cụ tham khảo: dữ liệu trích xuất từ bài báo khoa học, kèm bằng chứng trong PDF gốc.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
          </nav>
          {adminDbUrl() ? (
            <a href="/admin/quality" className="admin-link">
              Chất lượng (quản trị)
            </a>
          ) : null}
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Dữ liệu do AI trích xuất, chỉ để tham khảo. Người dùng có trách nhiệm đối chiếu với bài gốc trước khi sử dụng
          trong nghiên cứu.
        </footer>
      </body>
    </html>
  );
}
