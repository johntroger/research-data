/**
 * Short-lived links to a paper's PDF in the private R2 bucket (step 2.2b, Mục 7). The object key is the file hash, so no path
 * is ever stored or exposed; the link lasts 5 minutes and the browser downloads straight from R2. The web only holds a
 * read-only token (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY); without it the route falls back to the local file.
 */
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const LINK_SECONDS = 300;

export interface R2Config {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/** The read-only R2 settings, or null when any is missing (then PDFs come from the local folder). */
export function r2Config(env: Record<string, string | undefined> = process.env): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const bucket = env.R2_BUCKET?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  return accountId && bucket && accessKeyId && secretAccessKey ? { accountId, bucket, accessKeyId, secretAccessKey } : null;
}

/** The object key of a PDF: its SHA-256, 64 hex characters (anything else is refused, whatever the database says). */
export function pdfKey(fileHash: string | null | undefined): string | null {
  return fileHash && /^[0-9a-f]{64}$/.test(fileHash) ? `pdf/${fileHash}.pdf` : null;
}

/** The Content-Disposition R2 should answer with: inline for viewing, a named attachment for a download. */
export function dispositionFor(download: boolean, fileName: string): string {
  return download ? `attachment; filename="${fileName.replace(/[^A-Za-z0-9._-]/g, "_")}"` : "inline";
}

export async function presignPdf(config: R2Config, fileHash: string, options: { download: boolean; fileName: string; now?: Date }): Promise<string | null> {
  const key = pdfKey(fileHash);
  if (!key) return null;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ResponseContentType: "application/pdf",
    ResponseContentDisposition: dispositionFor(options.download, options.fileName),
  });
  return getSignedUrl(client, command, { expiresIn: LINK_SECONDS, ...(options.now ? { signingDate: options.now } : {}) });
}
