/**
 * The quality report with the owner's own signed-in session (step A.3): one call to the database function, which answers only a session
 * whose token says app_metadata.role = owner. No direct database connection is needed, so this works on a deployed site.
 */
import { toReport, type QualityReport, type RawReport } from "./quality";
import { supabaseServer } from "./supabase-server";

export async function loadQualityAsOwner(options: { source?: string; limit?: number } = {}): Promise<QualityReport> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("quality_report", { p_source: options.source?.trim() || null, p_limit: options.limit ?? 15 });
  if (error) throw new Error(`quality_report: ${error.message}`);
  return toReport(data as RawReport);
}
