/**
 * Who is the project owner (step A.2, D2). Pure rules, no I/O, so they are tested without a database: the owner is either
 * the developer's own machine (the existing shortcut: a direct database connection exists, which a deployed site never has),
 * or a signed-in user whose email is confirmed, listed in ADMIN_EMAILS and marked role = owner in app_metadata (which only the
 * service role can write, unlike user_metadata). Anything else is a visitor.
 */

export interface AuthUser {
  email?: string | null;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
}

export interface Owner {
  email: string | null;
  via: "dev" | "session";
}

/** ADMIN_EMAILS: comma-separated, case-insensitive. Empty means nobody can sign in as owner. */
export function parseAdminEmails(env: Record<string, string | undefined> = process.env): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ownerFrom(check: { devShortcut: boolean; user: AuthUser | null; allowed: string[] }): Owner | null {
  // A real signed-in owner counts as one even on the developer machine, so the page shows who is signed in and the sign-out button.
  const user = check.user;
  const email = user?.email?.trim().toLowerCase();
  if (user && email && user.email_confirmed_at && user.app_metadata?.role === "owner" && check.allowed.includes(email)) return { email, via: "session" };
  return check.devShortcut ? { email: null, via: "dev" } : null;
}

/** Where to go after signing in: a path on this site only, never another address. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\r\n]/.test(next)) return "/";
  return next;
}
