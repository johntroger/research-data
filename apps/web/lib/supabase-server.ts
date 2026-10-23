/**
 * The signed-in session, server side (step A.2). The Supabase client keeps the session in cookies; `getUser()` asks the Auth service
 * to validate the token (never trusts the cookie alone). A visitor has no Supabase cookie, so no request is made for them.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { adminDbUrl } from "./admin-db";
import { ownerFrom, parseAdminEmails, type AuthUser, type Owner } from "./owner";

function keys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, key };
}

/** A Supabase client bound to this request's cookies; it can set cookies in server actions and route handlers. */
export async function supabaseServer() {
  const store = await cookies();
  const { url, key } = keys();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, which cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in user of this request (validated by Supabase), or null for a visitor. One check per request. */
export const sessionUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  if (!store.getAll().some((c) => c.name.startsWith("sb-"))) return null;
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user ?? null;
});

/** The project owner of this request, or null: the developer machine, or the signed-in owner (lib/owner.ts). */
export const getOwner = cache(async (): Promise<Owner | null> => ownerFrom({ devShortcut: adminDbUrl() !== null, user: await sessionUser(), allowed: parseAdminEmails() }));
