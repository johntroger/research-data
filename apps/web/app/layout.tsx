import type { Metadata } from "next";
import type { ReactNode } from "react";
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
          <span className="tagline">bộ khung thử nghiệm (bước 0.8)</span>
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
