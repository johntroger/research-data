/**
 * Splits the study calls of a paper into inline Batch jobs that each stay under a size limit
 * (every request carries the whole PDF, so a paper with many Studies passes 20 MB quickly).
 * Studies are never split: all four calls of one Study go into the same job.
 */
import { batchBytes, type BatchItem } from "./batch-client.js";

/** Below the 20 MB provider limit: the in-prompt schema of deep passes is not counted by `batchBytes`. */
export const CHUNK_BYTES = 15 * 1024 * 1024;

export function chunkByStudy(items: BatchItem[], limitBytes = CHUNK_BYTES): BatchItem[][] {
  const byStudy = new Map<string, BatchItem[]>();
  for (const it of items) byStudy.set(it.key.split(":")[0]!, [...(byStudy.get(it.key.split(":")[0]!) ?? []), it]);
  const chunks: BatchItem[][] = [];
  let current: BatchItem[] = [];
  for (const study of byStudy.values()) {
    if (batchBytes(study) > limitBytes) throw new Error(`One study alone is over the ${Math.round(limitBytes / 1048576)} MB Batch limit (${study.length} requests)`);
    if (current.length && batchBytes([...current, ...study]) > limitBytes) {
      chunks.push(current);
      current = [];
    }
    current.push(...study);
  }
  if (current.length) chunks.push(current);
  return chunks;
}
