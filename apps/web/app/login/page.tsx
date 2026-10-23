import Link from "next/link";
import { getOwner } from "@/lib/supabase-server";
import { requestLink } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đăng nhập" };

const ERRORS: Record<string, string> = {
  empty: "Hãy nhập địa chỉ email.",
  wait: "Vừa gửi link xong. Hãy đợi khoảng một phút rồi thử lại.",
  denied: "Đăng nhập không thành công (link hết hạn, đã dùng, hoặc không phải tài khoản chủ). Hãy xin link mới.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const owner = await getOwner();

  return (
    <>
      <h1>Đăng nhập chủ dự án</h1>
      <p className="muted">Chỉ chủ dự án có tài khoản; khách xem dữ liệu công khai không cần đăng nhập. Không có mật khẩu: web gửi một link đăng nhập tới email của chủ.</p>
      {owner?.via === "session" ? (
        <p data-testid="login-already">
          Đã đăng nhập bằng <strong>{owner.email}</strong>. <Link href="/">Về trang chủ</Link>
        </p>
      ) : (
        <form action={requestLink} className="login-form" data-testid="login-form">
          <label>
            Email{" "}
            <input type="email" name="email" required autoComplete="email" maxLength={254} placeholder="email của chủ dự án" />
          </label>{" "}
          <button type="submit">Gửi link đăng nhập</button>
        </form>
      )}
      {sent && (
        <p className="login-note" role="status" data-testid="login-sent">
          Nếu đây là email của chủ dự án, một link đăng nhập đã được gửi. Link dùng một lần và hết hạn sau 15 phút; hãy mở nó bằng <strong>chính trình duyệt này</strong>.
        </p>
      )}
      {error && (
        <p className="login-note login-error" role="alert" data-testid="login-error">
          {error}
        </p>
      )}
    </>
  );
}
