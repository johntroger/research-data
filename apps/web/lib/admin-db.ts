/**
 * Direct database access for the admin pages (step 1b.5), which need what visitors must not see: hidden
 * fields and the extraction runs. It is a plain Postgres connection, so it only exists where the database is
 * reachable: on the local machine in development, or wherever SUPABASE_DB_URL is set on purpose. A deployed
 * site has neither, and the admin pages answer 404 there (until real admin sign-in exists, Giai đoạn 3).
 */
import pg from "pg";

const LOCAL_DEFAULT = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** The connection string for admin pages, or null when admin pages must not be served. */
export function adminDbUrl(env: Record<string, string | undefined> = process.env): string | null {
  const explicit = env.SUPABASE_DB_URL?.trim();
  if (explicit) return explicit;
  return env.NODE_ENV === "development" ? LOCAL_DEFAULT : null;
}

export async function withAdminDb<T>(fn: (db: pg.Client) => Promise<T>): Promise<T> {
  const url = adminDbUrl();
  if (!url) throw new Error("Admin database access is not available here");
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}
