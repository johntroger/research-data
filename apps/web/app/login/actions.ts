"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseAdminEmails } from "@/lib/owner";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Sends the owner a sign-in link. The answer is the same for every address ("if this is the owner's email, a link was sent"), so the
 * page does not reveal who the owner is, and an address that is not on the owner list never reaches Supabase (no mail, no quota used).
 */
export async function requestLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email.length > 254) redirect("/login?error=empty");

  let throttled = false;
  if (parseAdminEmails().includes(email)) {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, ...(host ? { emailRedirectTo: `${proto}://${host}/auth/callback` } : {}) },
    });
    throttled = Boolean(error && (error.status === 429 || /rate|second|minute|frequen/i.test(error.message)));
  }
  redirect(throttled ? "/login?error=wait" : "/login?sent=1");
}
