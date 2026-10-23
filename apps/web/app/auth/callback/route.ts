/**
 * Where the emailed sign-in link lands (step A.2): trades the one-time code for a session cookie, then sends the owner on. A session
 * for anyone who is not the owner is thrown away at once, even though Supabase has signups off.
 */
import { NextResponse } from "next/server";
import { ownerFrom, parseAdminEmails, safeNext } from "@/lib/owner";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await supabaseServer();

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })).error;

  if (ok) {
    const { data } = await supabase.auth.getUser();
    if (!ownerFrom({ devShortcut: false, user: data.user ?? null, allowed: parseAdminEmails() })) {
      await supabase.auth.signOut();
      ok = false;
    }
  }
  return NextResponse.redirect(new URL(ok ? next : "/login?error=denied", url.origin), 303);
}
