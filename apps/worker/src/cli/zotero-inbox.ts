/**
 * Step 0.12: reads the Zotero inbox (Research Data › Inbox) with a READ-ONLY key, lists the papers
 * and downloads their PDFs into raw_papers/zotero/ (git-ignored).  Usage: pnpm zotero:inbox
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT, zoteroConfig } from "../config.js";
import { readTextLayer } from "../pdf/text-layer.js";
import { readOnlyKeyProblems, ZoteroClient } from "../zotero/client.js";
import { collectionTree, findCollection, inboxPath, listInbox } from "../zotero/inbox.js";

// Wrapped in main() and ending with process.exitCode (not process.exit), which avoids a libuv
// assertion on Windows when the process exits while fetch handles are still closing.
async function main(): Promise<number> {
  const config = zoteroConfig();
  const client = new ZoteroClient(config);

  const key = await client.keyInfo();
  const problems = readOnlyKeyProblems(key, config.userId);
  console.log(`Zotero user ${key.userID}${key.username ? ` (${key.username})` : ""}`);
  console.log(
    `Key access: library=${key.access.user?.library ?? false}, files=${key.access.user?.files ?? false}, ` +
      `notes=${key.access.user?.notes ?? false}, write=${key.access.user?.write ?? false}`,
  );
  if (problems.length) {
    console.error(`\nKey not suitable for this phase:\n  - ${problems.join("\n  - ")}`);
    return 1;
  }

  const path_ = inboxPath(process.env.ZOTERO_INBOX_PATH);
  const inboxName = path_.join(" › ");
  const collectionKey = await findCollection(client, path_);
  if (!collectionKey) {
    console.error(
      `\nCollection "${inboxName}" not found in My Library. Create "Research Data" with the sub-collection ` +
        `"Inbox" in Zotero and sync, or set ZOTERO_INBOX_PATH in .env to an existing collection. Collections:`,
    );
    for (const node of await collectionTree(client)) console.error(`${"  ".repeat(node.depth + 1)}${node.name}`);
    return 1;
  }
  console.log(`Collection "${inboxName}" = ${collectionKey}\n`);

  const papers = await listInbox(client, collectionKey);
  console.log(`${papers.length} item(s) in the inbox:`);

  const outDir = path.join(REPO_ROOT, "raw_papers", "zotero");
  await mkdir(outDir, { recursive: true });
  let downloaded = 0;
  let failed = 0;

  for (const paper of papers) {
    console.log(`\n• ${paper.firstAuthor ?? "?"} (${paper.year ?? "?"}) ${paper.title.slice(0, 70)}`);
    console.log(`  item ${paper.itemKey} · DOI ${paper.doi ?? "-"}`);
    if (!paper.attachmentKey) {
      console.log(`  ✗ ${paper.problem}`);
      continue;
    }
    const file = path.join(outDir, `${paper.attachmentKey}.pdf`);
    if (!existsSync(file)) {
      try {
        // Write to a temporary name first so an interrupted download never leaves a broken PDF.
        await writeFile(`${file}.part`, await client.downloadFile(paper.attachmentKey));
        await rename(`${file}.part`, file);
      } catch (error) {
        failed++;
        console.log(`  ✗ download failed after retries: ${(error as Error).message}`);
        continue;
      }
    }
    downloaded++;
    const layer = await readTextLayer(new Uint8Array(await readFile(file)));
    console.log(
      `  ✓ PDF ${paper.attachmentFilename ?? paper.attachmentKey} → ${path.relative(REPO_ROOT, file)}` +
        ` (${layer.pageCount} pages, SHA-256 ${layer.fileHash.slice(0, 12)}…${layer.needsOcr ? ", needs OCR" : ""})`,
    );
  }
  const missing = papers.filter((p) => !p.attachmentKey).length;
  console.log(`
Summary: ${downloaded} PDF ready, ${missing} without a stored PDF, ${failed} failed downloads.`);
  return failed ? 1 : 0;
}

process.exitCode = await main();
