/**
 * Backup of the saved extractions (`extracted_data/`) to the private R2 backups bucket (step 2.4b). Pure choices here, no I/O:
 * which files go in, how the archive is named, which old archives to delete. Only the files at the top of the folder are
 * saved (saved extractions, OCR text, ledgers); the sub-folders `backups/` (old database dumps, which have their own nightly
 * backup) and `audit/` (samples taken for quality checks, with quotes from copyrighted papers) stay out.
 */

export const ARCHIVE_PREFIX = "extracted/";
const ARCHIVE_PATTERN = /^extracted\/extracted-\d{4}-\d{2}-\d{2}T\d{6}Z\.tar\.gz$/;

export interface Entry {
  name: string;
  isDirectory: boolean;
}

/** Top-level regular files, sorted; no folders, no hidden files, no SQL dumps. */
export function selectBackupFiles(entries: Entry[]): string[] {
  return entries
    .filter((e) => !e.isDirectory && !e.name.startsWith(".") && !e.name.toLowerCase().endsWith(".sql"))
    .map((e) => e.name)
    .sort();
}

export function skippedFolders(entries: Entry[]): string[] {
  return entries.filter((e) => e.isDirectory).map((e) => e.name).sort();
}

/** `extracted/extracted-2026-10-23T120000Z.tar.gz`: sorting the names sorts by age. */
export function archiveKey(now: Date): string {
  return `${ARCHIVE_PREFIX}extracted-${now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").replace(/^(\d{4})(\d{2})(\d{2})T/, "$1-$2-$3T")}.tar.gz`;
}

/** The old archives to delete so that only the newest `keep` remain; keys that are not archives of this command are never returned. */
export function archivesToDelete(keys: string[], keep: number): string[] {
  if (!Number.isInteger(keep) || keep < 2) throw new Error("keep must be a whole number of at least 2");
  const archives = keys.filter((k) => ARCHIVE_PATTERN.test(k)).sort();
  return archives.length > keep ? archives.slice(0, archives.length - keep) : [];
}
