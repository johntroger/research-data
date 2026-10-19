/**
 * `pnpm worker manual export --paper X [--code NAME]` (step 1b.8a): writes the work packet of one paper into
 * PACKETS_DIR. Never touches answers an agent has already written.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import { buildPacket, PACKET_FILES, type PacketFile } from "./packet.js";

export interface PaperRow {
  fileHash: string;
  pdfPath: string;
  title: string | null;
}

/** The one paper whose title contains `query` or whose file hash starts with it. */
export async function findPaper(db: pg.Client, query: string): Promise<PaperRow> {
  const q = query.toLowerCase();
  const res = await db.query<{ file_hash: string; pdf_path: string; title: string | null }>("select file_hash, pdf_path, title from papers where pdf_path is not null order by created_at");
  const hits = res.rows.filter((r) => r.file_hash.startsWith(q) || (r.title ?? "").toLowerCase().includes(q));
  if (hits.length !== 1) throw new Error(`--paper "${query}" matches ${hits.length} papers (need exactly one)`);
  const r = hits[0]!;
  return { fileHash: r.file_hash, pdfPath: r.pdf_path, title: r.title };
}

/** Packet folder names are plain words: no path separators, so a code cannot point outside PACKETS_DIR. */
export function checkCode(code: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(code)) throw new Error(`Invalid packet name "${code}": use letters, digits, ".", "_" or "-"`);
  return code;
}

/**
 * Writes the files into `<root>/<code>/` and makes the empty `out/`. Refuses when `out/` already holds answers
 * (an agent's work is never overwritten), unless `force` is set.
 */
export async function writePacket(root: string, code: string, files: PacketFile[], options: { force?: boolean } = {}): Promise<string> {
  const dir = path.join(root, checkCode(code));
  const out = path.join(dir, PACKET_FILES.out);
  const existing = await readdir(out).catch(() => [] as string[]);
  if (existing.length > 0 && !options.force) throw new Error(`${out} already holds ${existing.length} file(s); not overwriting (use --force to rewrite the packet; answers are kept)`);
  await mkdir(out, { recursive: true });
  for (const file of files) {
    const target = path.join(dir, ...file.path.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  return dir;
}

export async function exportPacket(db: pg.Client, opts: { repoRoot: string; packetsRoot: string; paper: string; code?: string; force?: boolean }): Promise<{ dir: string; paper: PaperRow; code: string }> {
  if (opts.code !== undefined) checkCode(opts.code); // before anything is read
  const paper = await findPaper(db, opts.paper);
  const code = opts.code ?? paper.fileHash.slice(0, 12);
  const pdf = new Uint8Array(await readFile(path.join(opts.repoRoot, paper.pdfPath)));
  const dir = await writePacket(opts.packetsRoot, code, buildPacket({ code, fileHash: paper.fileHash, title: paper.title, pdf }), { force: opts.force ?? false });
  return { dir, paper, code };
}
