/**
 * Runs before every page and route. Two jobs:
 *  1. Rate limiting by IP (step A.5, lib/rate-limit.ts): too many requests get 429 with Retry-After. On in production, off in development
 *     (RATE_LIMIT=on|off overrides). The forwarded-for header is believed only with TRUST_PROXY=1, set where a proxy overwrites it (Vercel).
 *  2. Keeps the signed-in session fresh (step A.2): the access token lasts an hour, and only a request/response pair can write the
 *     renewed cookies, which a Server Component cannot. A visitor has no Supabase cookie and passes straight through.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, enforce, memoryStore, rateLimitEnabled, rulesFor, visitorId } from "./lib/rate-limit";

// One store for the life of the server process; a shared one (Upstash) replaces it when the site runs on serverless functions (step 4).
const store = memoryStore();
const salt = process.env.RATE_LIMIT_SALT?.trim() || crypto.randomUUID();

export async function proxy(request: NextRequest) {
  if (rateLimitEnabled(process.env)) {
    const prefetch = request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch" || (request.headers.get("sec-purpose") ?? "").includes("prefetch");
    const rules = rulesFor({ pathname: request.nextUrl.pathname, method: request.method, search: request.nextUrl.searchParams, prefetch });
    if (rules.length > 0) {
      const visitor = await visitorId(clientIp(request.headers, process.env.TRUST_PROXY === "1"), salt);
      const verdict = await enforce(store, rules, visitor, Date.now());
      if (!verdict.allowed) {
        return new NextResponse(`Bạn gửi quá nhiều yêu cầu. Hãy thử lại sau ${verdict.retryAfterSec} giây.`, {
          status: 429,
          headers: { "Retry-After": String(verdict.retryAfterSec), "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
    }
  }

  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
