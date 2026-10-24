/** The usage counters with the owner's own signed-in session (step 4.6): the database function answers only a token marked role = owner. */
import type { UsageRow } from "./usage-report";
import { supabaseServer } from "./supabase-server";

export async function loadUsageAsOwner(days = 30): Promise<UsageRow[]> {
  const { data, error } = await (await supabaseServer()).rpc("usage_report", { p_days: days });
  if (error) throw new Error(`usage_report: ${error.message}`);
  return data as UsageRow[];
}
