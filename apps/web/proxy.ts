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
import { upstashFromEnv, upstashStore } from "./lib/rate-limit-upstash";
import { isLang, LANG_COOKIE, parseLang, translate } from "./lib/i18n";

// With Upstash configured (UPSTASH_REDIS_REST_URL and _TOKEN, or the KV_REST_API_* names of the Vercel integration) the limits are shared by every
// function instance; without it they live in the memory of this process, which is right for one server and for development.
const upstash = upstashFromEnv(process.env);
const store = upstash ? upstashStore(upstash) : memoryStore();
// Rules marked `shared: false` (pages, searches) are counted here, in this instance's memory, so a visit costs no round trip to the shared store.
const localStore = upstash ? memoryStore() : store;
// The salt must be the same in every function instance that shares a store, or one visitor would be counted under a different name in each:
// RATE_LIMIT_SALT, else (with Upstash) the store's own secret token, else a random one for this process.
const salt = process.env.RATE_LIMIT_SALT?.trim() || upstash?.token || crypto.randomUUID();

export async function proxy(request: NextRequest) {
  // ?lang=vi|en: remember the choice in a cookie (a plain preference, nothing that identifies anyone) and go back to the same address without it.
  const asked = request.nextUrl.searchParams.get("lang");
  if (isLang(asked)) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("lang");
    const response = NextResponse.redirect(clean, 303);
    response.cookies.set(LANG_COOKIE, asked, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    return response;
  }
  if (rateLimitEnabled(process.env)) {
    const prefetch = request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch" || (request.headers.get("sec-purpose") ?? "").includes("prefetch");
    const rules = rulesFor({ pathname: request.nextUrl.pathname, method: request.method, search: request.nextUrl.searchParams, prefetch });
    if (rules.length > 0) {
      const visitor = await visitorId(clientIp(request.headers, process.env.TRUST_PROXY === "1"), salt);
      const verdict = await enforce(store, rules, visitor, Date.now(), localStore);
      if (!verdict.allowed) {
        return new NextResponse(translate(parseLang(request.cookies.get(LANG_COOKIE)?.value), "rate.tooMany", { sec: verdict.retryAfterSec }), {
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
