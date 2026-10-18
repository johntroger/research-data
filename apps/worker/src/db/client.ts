import pg from "pg";
import { loadEnv } from "../config.js";

/** Local Supabase database (Supabase CLI default). The cloud `prod` URL comes from .env in Giai đoạn 2. */
export const LOCAL_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function dbUrl(): string {
  loadEnv();
  return process.env.SUPABASE_DB_URL?.trim() || LOCAL_DB_URL;
}

export async function connect(url = dbUrl()): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  return client;
}

/** Runs `fn` in one transaction: all writes succeed together or none are kept. */
export async function withTransaction<T>(client: pg.Client, fn: () => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    const result = await fn();
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
