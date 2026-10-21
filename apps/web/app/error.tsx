"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

/**
 * What a visitor sees when a page cannot read its data (database not running, network down), instead of a bare
 * "500". On this machine the usual cause is that Docker Desktop or the local database is not started.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // The failed page is a server page: it has to be fetched again, then the error is cleared.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <section role="alert" data-testid="load-error">
      <h1>Không đọc được dữ liệu</h1>
      <p>Trang này cần đọc dữ liệu từ cơ sở dữ liệu nhưng không kết nối được.</p>
      <p>Nếu bạn đang chạy trên máy của mình, thường là cơ sở dữ liệu chưa bật:</p>
      <ol>
        <li>Mở Docker Desktop và đợi nó khởi động xong.</li>
        <li>
          Trong thư mục dự án chạy <code>pnpm db:start</code>.
        </li>
        <li>Bấm «Thử lại» bên dưới.</li>
      </ol>
      <p>
        <button type="button" onClick={retry} data-testid="load-error-retry">
          Thử lại
        </button>{" "}
        <a href="/">Về trang chủ</a>
      </p>
    </section>
  );
}
